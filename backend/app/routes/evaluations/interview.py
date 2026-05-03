"""
Interview Evaluation Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationType, EvaluationStatus, InterviewEvaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import (
    EvaluationResponse, InterviewStart, InterviewAnswer,
    InterviewQuestion, InterviewAnalysisResponse
)
from app.services.auth import get_current_user
from app.services.ai import groq_service

router = APIRouter(prefix="/evaluations/interview", tags=["Interview Evaluation"])

# Store active interview sessions (in production, use Redis)
active_sessions = {}


@router.post("/start", response_model=List[InterviewQuestion])
async def start_interview(
    data: InterviewStart,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new interview session with AI-generated questions."""
    # Create evaluation record
    evaluation = Evaluation(
        user_id=current_user.id,
        evaluation_type=EvaluationType.INTERVIEW,
        status=EvaluationStatus.IN_PROGRESS,
        input_data={"topic": data.topic, "difficulty": data.difficulty}
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    # Generate questions
    questions = await groq_service.generate_interview_questions(
        topic=data.topic,
        difficulty=data.difficulty,
        count=5
    )
    
    # Store session
    active_sessions[f"{current_user.id}_{evaluation.id}"] = {
        "evaluation_id": evaluation.id,
        "questions": questions,
        "answers": [],
        "topic": data.topic,
        "difficulty": data.difficulty
    }
    
    # Create interview record
    interview_eval = InterviewEvaluation(
        evaluation_id=evaluation.id,
        questions=questions,
        answers=[],
        topic=data.topic,
        difficulty=data.difficulty
    )
    
    db.add(interview_eval)
    db.commit()
    
    return [
        InterviewQuestion(
            id=q.get("id"),
            question=q.get("question"),
            topic=q.get("topic"),
            difficulty=q.get("difficulty")
        )
        for q in questions
    ]


@router.post("/{evaluation_id}/answer")
async def submit_answer(
    evaluation_id: int,
    answer: InterviewAnswer,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit an answer for an interview question."""
    session_key = f"{current_user.id}_{evaluation_id}"
    
    if session_key not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
        )
    
    session = active_sessions[session_key]
    session["answers"].append({
        "question_id": answer.question_id,
        "answer": answer.answer
    })
    
    # Update database
    interview_eval = db.query(InterviewEvaluation).filter(
        InterviewEvaluation.evaluation_id == evaluation_id
    ).first()
    
    if interview_eval:
        interview_eval.answers = session["answers"]
        db.commit()
    
    return {"status": "answer recorded", "answers_count": len(session["answers"])}


@router.post("/{evaluation_id}/complete", response_model=InterviewAnalysisResponse)
async def complete_interview(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete interview and get analysis."""
    session_key = f"{current_user.id}_{evaluation_id}"
    
    if session_key not in active_sessions:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
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
    ai_analysis = await groq_service.analyze_interview_answers(questions_with_answers)
    
    # Calculate overall score
    overall_score = (
        ai_analysis.get("technical_score", 0) * 0.4 +
        ai_analysis.get("communication_score", 0) * 0.3 +
        ai_analysis.get("problem_solving_score", 0) * 0.3
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
    
    # Update interview record
    interview_eval = db.query(InterviewEvaluation).filter(
        InterviewEvaluation.evaluation_id == evaluation_id
    ).first()
    
    if interview_eval:
        interview_eval.technical_score = ai_analysis.get("technical_score", 0)
        interview_eval.communication_score = ai_analysis.get("communication_score", 0)
        interview_eval.problem_solving_score = ai_analysis.get("problem_solving_score", 0)
    
    # Update readiness score
    readiness = db.query(ReadinessScore).filter(
        ReadinessScore.user_id == current_user.id
    ).first()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)
    
    readiness.interview_score = overall_score
    readiness.interview_completed = 1
    readiness.overall_score = _calculate_overall_readiness(readiness)
    
    db.commit()
    
    # Clean up session
    del active_sessions[session_key]
    
    return InterviewAnalysisResponse(
        technical_score=ai_analysis.get("technical_score", 0),
        communication_score=ai_analysis.get("communication_score", 0),
        problem_solving_score=ai_analysis.get("problem_solving_score", 0),
        overall_score=overall_score,
        questions_analysis=ai_analysis.get("questions_analysis", []),
        feedback=ai_analysis.get("feedback", ""),
        recommendations=ai_analysis.get("recommendations", [])
    )


@router.get("/latest", response_model=EvaluationResponse)
async def get_latest_interview_evaluation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the latest Interview evaluation."""
    evaluation = db.query(Evaluation).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.evaluation_type == EvaluationType.INTERVIEW
    ).order_by(Evaluation.created_at.desc()).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Interview evaluation found"
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
