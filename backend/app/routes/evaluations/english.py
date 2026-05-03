"""
English Assessment Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Dict, Any
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationType, EvaluationStatus, EnglishEvaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import (
    EvaluationResponse, EnglishStart, EnglishAnswer, EnglishAnalysisResponse
)
from app.services.auth import get_current_user
from app.services.ai import groq_service

router = APIRouter(prefix="/evaluations/english", tags=["English Assessment"])

# Store active assessment sessions
active_sessions = {}


@router.post("/start", response_model=List[Dict[str, Any]])
async def start_assessment(
    data: EnglishStart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new English assessment session."""
    # Create evaluation record
    evaluation = Evaluation(
        user_id=current_user.id,
        evaluation_type=EvaluationType.ENGLISH,
        status=EvaluationStatus.IN_PROGRESS,
        input_data={"assessment_type": data.assessment_type}
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    # Generate questions
    questions = await groq_service.generate_english_questions(
        assessment_type=data.assessment_type,
        count=10
    )
    
    # Store session
    active_sessions[f"{current_user.id}_{evaluation.id}"] = {
        "evaluation_id": evaluation.id,
        "questions": questions,
        "answers": [],
        "assessment_type": data.assessment_type
    }
    
    # Create english record
    english_eval = EnglishEvaluation(
        evaluation_id=evaluation.id,
        assessment_type=data.assessment_type,
        questions=questions,
        answers=[]
    )
    
    db.add(english_eval)
    db.commit()
    
    # Return questions without correct answers
    return [
        {
            "id": q.get("id"),
            "type": q.get("type"),
            "question": q.get("question"),
            "options": q.get("options"),
            "skill_tested": q.get("skill_tested")
        }
        for q in questions
    ]


@router.post("/{evaluation_id}/answer")
async def submit_answer(
    evaluation_id: int,
    answer: EnglishAnswer,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer for an English assessment question."""
    session_key = f"{current_user.id}_{evaluation_id}"
    
    if session_key not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )
    
    session = active_sessions[session_key]
    session["answers"].append({
        "question_id": answer.question_id,
        "answer": answer.answer
    })
    
    # Update database
    english_eval = db.query(EnglishEvaluation).filter(
        EnglishEvaluation.evaluation_id == evaluation_id
    ).first()
    
    if english_eval:
        english_eval.answers = session["answers"]
        db.commit()
    
    return {"status": "answer recorded", "answers_count": len(session["answers"])}


@router.post("/{evaluation_id}/complete", response_model=EnglishAnalysisResponse)
async def complete_assessment(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete English assessment and get analysis."""
    session_key = f"{current_user.id}_{evaluation_id}"
    
    if session_key not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )
    
    session = active_sessions[session_key]
    
    # Prepare questions with answers for analysis
    questions_with_answers = []
    for q in session["questions"]:
        answer_obj = next(
            (a for a in session["answers"] if a["question_id"] == q["id"]),
            {"answer": "No answer provided"}
        )
        questions_with_answers.append({
            **q,
            "user_answer": answer_obj["answer"]
        })
    
    # AI Analysis
    ai_analysis = await groq_service.analyze_english_answers(questions_with_answers)
    
    # Calculate overall score
    overall_score = (
        ai_analysis.get("grammar_score", 0) * 0.3 +
        ai_analysis.get("vocabulary_score", 0) * 0.25 +
        ai_analysis.get("fluency_score", 0) * 0.2 +
        ai_analysis.get("comprehension_score", 0) * 0.25
    )
    
    # Update evaluation
    evaluation = db.query(Evaluation).filter(
        Evaluation.id == evaluation_id,
        Evaluation.user_id == current_user.id
    ).first()
    
    if evaluation:
        evaluation.status = EvaluationStatus.COMPLETED
        evaluation.score = overall_score
        evaluation.analysis = ai_analysis
        evaluation.feedback = ai_analysis.get("feedback", "")
        evaluation.recommendations = ai_analysis.get("recommendations", [])
        evaluation.completed_at = datetime.utcnow()
    
    # Update english record
    english_eval = db.query(EnglishEvaluation).filter(
        EnglishEvaluation.evaluation_id == evaluation_id
    ).first()
    
    if english_eval:
        english_eval.grammar_score = ai_analysis.get("grammar_score", 0)
        english_eval.vocabulary_score = ai_analysis.get("vocabulary_score", 0)
        english_eval.fluency_score = ai_analysis.get("fluency_score", 0)
        english_eval.comprehension_score = ai_analysis.get("comprehension_score", 0)
    
    # Update readiness score
    readiness = db.query(ReadinessScore).filter(
        ReadinessScore.user_id == current_user.id
    ).first()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)
    
    readiness.english_score = overall_score
    readiness.english_completed = 1
    readiness.overall_score = _calculate_overall_readiness(readiness)
    
    db.commit()
    
    # Clean up session
    del active_sessions[session_key]
    
    return EnglishAnalysisResponse(
        grammar_score=ai_analysis.get("grammar_score", 0),
        vocabulary_score=ai_analysis.get("vocabulary_score", 0),
        fluency_score=ai_analysis.get("fluency_score", 0),
        comprehension_score=ai_analysis.get("comprehension_score", 0),
        overall_score=overall_score,
        cefr_level=ai_analysis.get("cefr_level", "B1"),
        feedback=ai_analysis.get("feedback", ""),
        recommendations=ai_analysis.get("recommendations", [])
    )


@router.get("/latest", response_model=EvaluationResponse)
async def get_latest_english_evaluation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the latest English evaluation."""
    evaluation = db.query(Evaluation).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.evaluation_type == EvaluationType.ENGLISH
    ).order_by(Evaluation.created_at.desc()).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No English evaluation found"
        )
    
    return evaluation


def _calculate_overall_readiness(readiness: ReadinessScore) -> float:
    """Calculate overall readiness score."""
    scores = []
    
    if readiness.cv_completed:
        scores.append(readiness.cv_score)
    if readiness.github_completed:
        scores.append(readiness.github_score)
    if readiness.linkedin_completed:
        scores.append(readiness.linkedin_score)
    if readiness.idea_completed:
        scores.append(readiness.idea_score)
    if readiness.interview_completed:
        scores.append(readiness.interview_score)
    if readiness.english_completed:
        scores.append(readiness.english_score)
    
    if not scores:
        return 0.0
    
    return sum(scores) / len(scores)
