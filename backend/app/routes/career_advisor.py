"""
Career Advisor Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, Optional
from app.database import get_db
from app.models.user import User
from app.models.readiness import ReadinessScore
from app.models.evaluation import Evaluation, EvaluationType
from app.schemas.career_advisor import CareerAdviceRequest, CareerAdviceResponse
from app.services.auth import get_current_user
from app.services.ai.groq_service import groq_service

router = APIRouter(prefix="/career-advisor", tags=["Career Advisor"])


async def get_latest_evaluation(
    user_id: int,
    evaluation_type: EvaluationType,
    db: AsyncSession
) -> Optional[Evaluation]:
    result = await db.execute(
        select(Evaluation)
        .where(Evaluation.user_id == user_id, Evaluation.evaluation_type == evaluation_type)
        .order_by(Evaluation.created_at.desc())
    )
    return result.scalars().first()


def build_evaluation_summary(evaluation: Optional[Evaluation]) -> Dict[str, Any]:
    if not evaluation:
        return {}

    analysis = evaluation.analysis or {}
    summary = {
        "score": evaluation.score,
        "feedback": evaluation.feedback,
        "recommendations": evaluation.recommendations,
        "analysis": analysis,
    }

    return summary


@router.post("/advice", response_model=CareerAdviceResponse)
async def generate_career_advice(
    payload: CareerAdviceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate career advice based on user data and evaluations."""
    readiness_result = await db.execute(
        select(ReadinessScore).where(ReadinessScore.user_id == current_user.id)
    )
    readiness = readiness_result.scalar_one_or_none()

    cv_eval = await get_latest_evaluation(current_user.id, EvaluationType.CV, db)
    github_eval = await get_latest_evaluation(current_user.id, EvaluationType.GITHUB, db)
    linkedin_eval = await get_latest_evaluation(current_user.id, EvaluationType.LINKEDIN, db)
    idea_eval = await get_latest_evaluation(current_user.id, EvaluationType.IDEA, db)
    interview_eval = await get_latest_evaluation(current_user.id, EvaluationType.INTERVIEW, db)
    english_eval = await get_latest_evaluation(current_user.id, EvaluationType.ENGLISH, db)

    user_profile = {
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role.value,
        "github_username": current_user.github_username,
        "linkedin_url": current_user.linkedin_url,
        "university": current_user.university,
        "major": current_user.major,
        "graduation_year": current_user.graduation_year,
        "onboarding_summary": current_user.onboarding_summary,
        "readiness": {
            "overall_score": readiness.overall_score if readiness else 0,
            "cv_score": readiness.cv_score if readiness else 0,
            "github_score": readiness.github_score if readiness else 0,
            "linkedin_score": readiness.linkedin_score if readiness else 0,
            "idea_score": readiness.idea_score if readiness else 0,
            "interview_score": readiness.interview_score if readiness else 0,
            "english_score": readiness.english_score if readiness else 0,
        },
    }

    evaluations = {
        "cv": build_evaluation_summary(cv_eval),
        "github": build_evaluation_summary(github_eval),
        "linkedin": build_evaluation_summary(linkedin_eval),
        "idea": build_evaluation_summary(idea_eval),
        "interview": build_evaluation_summary(interview_eval),
        "english": build_evaluation_summary(english_eval),
    }

    target_role = payload.target_role or "Full Stack"
    message = payload.message or "Provide career advice based on my profile and evaluations."

    try:
        content = await groq_service.generate_career_advice(user_profile, evaluations, target_role, message)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI advice failed: {exc}")

    return CareerAdviceResponse(content=content)
