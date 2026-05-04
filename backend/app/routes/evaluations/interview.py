"""
Interview Evaluation Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
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
from app.services.readiness import calculate_overall_readiness
from app.services.session_store import get_session, set_session, delete_session
from app.rate_limiter import limiter

router = APIRouter(prefix="/evaluations/interview", tags=["Interview Evaluation"])

SESSION_TTL_SECONDS = 3600


@router.post("/start", response_model=List[InterviewQuestion])
@limiter.limit("5/minute")
async def start_interview(
    request: Request,
    data: InterviewStart,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
    await db.commit()
    await db.refresh(evaluation)
    
    # Generate questions
    questions = await groq_service.generate_interview_questions(
        topic=data.topic,
        difficulty=data.difficulty,
        count=5
    )
    
    session_key = f"interview:{current_user.id}:{evaluation.id}"
    await set_session(
        session_key,
        {
            "evaluation_id": evaluation.id,
            "questions": questions,
            "answers": [],
            "topic": data.topic,
            "difficulty": data.difficulty
        },
        SESSION_TTL_SECONDS
    )
    
    # Create interview record
    interview_eval = InterviewEvaluation(
        evaluation_id=evaluation.id,
        questions=questions,
        answers=[],
        topic=data.topic,
        difficulty=data.difficulty
    )
    
    db.add(interview_eval)
    await db.commit()
    
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
    db: AsyncSession = Depends(get_db)
):
    """Submit an answer for an interview question."""
    session_key = f"interview:{current_user.id}:{evaluation_id}"
    session = await get_session(session_key)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
        )

    session["answers"].append({
        "question_id": answer.question_id,
        "answer": answer.answer
    })

    await set_session(session_key, session, SESSION_TTL_SECONDS)
    
    # Update database
    result = await db.execute(select(InterviewEvaluation).where(InterviewEvaluation.evaluation_id == evaluation_id))
    interview_eval = result.scalar_one_or_none()
    
    if interview_eval:
        interview_eval.answers = session["answers"]
        await db.commit()
    
    return {"status": "answer recorded", "answers_count": len(session["answers"])}


@router.post("/{evaluation_id}/complete", response_model=InterviewAnalysisResponse)
async def complete_interview(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Complete interview and get analysis."""
    session_key = f"interview:{current_user.id}:{evaluation_id}"
    session = await get_session(session_key)

    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Interview session not found"
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
        ai_analysis = await groq_service.analyze_interview_answers(questions_with_answers)
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
        ai_analysis.get("technical_score", 0) * 0.4 +
        ai_analysis.get("communication_score", 0) * 0.3 +
        ai_analysis.get("problem_solving_score", 0) * 0.3
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
    
    # Update interview record
    interview_result = await db.execute(select(InterviewEvaluation).where(InterviewEvaluation.evaluation_id == evaluation_id))
    interview_eval = interview_result.scalar_one_or_none()
    
    if interview_eval:
        interview_eval.technical_score = ai_analysis.get("technical_score", 0)
        interview_eval.communication_score = ai_analysis.get("communication_score", 0)
        interview_eval.problem_solving_score = ai_analysis.get("problem_solving_score", 0)
    
    # Update readiness score
    readiness_result = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == current_user.id))
    readiness = readiness_result.scalar_one_or_none()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)

    readiness.interview_score = overall_score
    readiness.interview_completed = True
    readiness.overall_score = calculate_overall_readiness(readiness)

    await db.commit()

    await delete_session(session_key)
    
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
    db: AsyncSession = Depends(get_db)
):
    """Get the latest Interview evaluation."""
    result = await db.execute(
        select(Evaluation).where(
            Evaluation.user_id == current_user.id,
            Evaluation.evaluation_type == EvaluationType.INTERVIEW
        ).order_by(Evaluation.created_at.desc())
    )
    evaluation = result.scalars().first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Interview evaluation found"
        )
    
    return evaluation
