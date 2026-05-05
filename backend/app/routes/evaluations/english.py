"""
English Assessment Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
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
from app.services.readiness import calculate_overall_readiness
from app.services.session_store import get_session, set_session, delete_session
from app.rate_limiter import limiter

router = APIRouter(prefix="/evaluations/english", tags=["English Assessment"])

SESSION_TTL_SECONDS = 3600


@router.post("/start", response_model=List[Dict[str, Any]])
@limiter.limit("5/minute")
async def start_assessment(
    request: Request,
    data: EnglishStart,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
    await db.commit()
    await db.refresh(evaluation)
    
    # Generate questions
    questions = await groq_service.generate_english_questions(
        assessment_type=data.assessment_type,
        count=10
    )
    
    session_key = f"english:{current_user.id}:{evaluation.id}"
    await set_session(
        session_key,
        {
            "evaluation_id": evaluation.id,
            "questions": questions,
            "answers": [],
            "assessment_type": data.assessment_type
        },
        SESSION_TTL_SECONDS
    )
    
    # Create english record
    english_eval = EnglishEvaluation(
        evaluation_id=evaluation.id,
        assessment_type=data.assessment_type,
        questions=questions,
        answers=[]
    )
    
    db.add(english_eval)
    await db.commit()
    
    # Return questions without correct answers
    return [
        {
            "id": q.get("id"),
            "type": q.get("type"),
            "question": q.get("question"),
            "options": q.get("options"),
            "skill_tested": q.get("skill_tested"),
            "passage": q.get("passage")
        }
        for q in questions
    ]


@router.post("/{evaluation_id}/answer")
async def submit_answer(
    evaluation_id: int,
    answer: EnglishAnswer,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit an answer for an English assessment question."""
    session_key = f"english:{current_user.id}:{evaluation_id}"
    session = await get_session(session_key)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )
    session["answers"].append({
        "question_id": answer.question_id,
        "answer": answer.answer
    })

    await set_session(session_key, session, SESSION_TTL_SECONDS)
    
    # Update database
    result = await db.execute(select(EnglishEvaluation).where(EnglishEvaluation.evaluation_id == evaluation_id))
    english_eval = result.scalar_one_or_none()
    
    if english_eval:
        english_eval.answers = session["answers"]
        await db.commit()
    
    return {"status": "answer recorded", "answers_count": len(session["answers"])}


@router.post("/{evaluation_id}/complete", response_model=EnglishAnalysisResponse)
async def complete_assessment(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Complete English assessment and get analysis."""
    session_key = f"english:{current_user.id}:{evaluation_id}"
    session = await get_session(session_key)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )
    
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
    try:
        ai_analysis = await groq_service.analyze_english_answers(questions_with_answers)
    except Exception as exc:
        result = await db.execute(
            select(Evaluation).where(
                Evaluation.id == evaluation_id,
                Evaluation.user_id == current_user.id
            )
        )
        evaluation = result.scalar_one_or_none()
        if evaluation:
            evaluation.status = EvaluationStatus.FAILED
            evaluation.feedback = f"AI error: {exc}"
            await db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI analysis failed")
    
    # Calculate overall score
    overall_score = (
        ai_analysis.get("grammar_score", 0) * 0.3 +
        ai_analysis.get("vocabulary_score", 0) * 0.25 +
        ai_analysis.get("fluency_score", 0) * 0.2 +
        ai_analysis.get("comprehension_score", 0) * 0.25
    )
    
    # Update evaluation
    evaluation_result = await db.execute(
        select(Evaluation).where(
            Evaluation.id == evaluation_id,
            Evaluation.user_id == current_user.id
        )
    )
    evaluation = evaluation_result.scalar_one_or_none()
    
    if evaluation:
        evaluation.status = EvaluationStatus.COMPLETED
        evaluation.score = overall_score
        evaluation.analysis = ai_analysis
        evaluation.feedback = ai_analysis.get("feedback", "")
        evaluation.recommendations = ai_analysis.get("recommendations", [])
        evaluation.completed_at = datetime.now(timezone.utc)
    
    # Update english record
    english_result = await db.execute(select(EnglishEvaluation).where(EnglishEvaluation.evaluation_id == evaluation_id))
    english_eval = english_result.scalar_one_or_none()
    
    if english_eval:
        english_eval.grammar_score = ai_analysis.get("grammar_score", 0)
        english_eval.vocabulary_score = ai_analysis.get("vocabulary_score", 0)
        english_eval.fluency_score = ai_analysis.get("fluency_score", 0)
        english_eval.comprehension_score = ai_analysis.get("comprehension_score", 0)
    
    # Update readiness score
    readiness_result = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == current_user.id))
    readiness = readiness_result.scalar_one_or_none()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)

    readiness.english_score = overall_score
    readiness.english_completed = True
    readiness.overall_score = calculate_overall_readiness(readiness)

    await db.commit()

    await delete_session(session_key)
    
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
    db: AsyncSession = Depends(get_db)
):
    """Get the latest English evaluation."""
    result = await db.execute(
        select(Evaluation).where(
            Evaluation.user_id == current_user.id,
            Evaluation.evaluation_type == EvaluationType.ENGLISH
        ).order_by(Evaluation.created_at.desc())
    )
    evaluation = result.scalars().first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No English evaluation found"
        )
    
    return evaluation
