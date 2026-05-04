"""
Readiness Score Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import ReadinessScoreResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/readiness", tags=["Readiness"])


def map_readiness_response(readiness: ReadinessScore) -> dict:
    """Helper to map flat database model to nested schema."""
    level = "beginner"
    if readiness.overall_score >= 90:
        level = "expert"
    elif readiness.overall_score >= 75:
        level = "advanced"
    elif readiness.overall_score >= 50:
        level = "intermediate"
        
    return {
        "overall": readiness.overall_score,
        "level": level,
        "modules": {
            "cv": readiness.cv_score,
            "github": readiness.github_score,
            "linkedin": readiness.linkedin_score,
            "idea": readiness.idea_score,
            "interview": readiness.interview_score,
            "english": readiness.english_score,
        },
        "cv_completed": readiness.cv_completed,
        "github_completed": readiness.github_completed,
        "linkedin_completed": readiness.linkedin_completed,
        "idea_completed": readiness.idea_completed,
        "interview_completed": readiness.interview_completed,
        "english_completed": readiness.english_completed,
        "strengths": readiness.strengths,
        "weaknesses": readiness.weaknesses,
        "recommendations": readiness.recommendations,
        "career_suggestions": readiness.career_suggestions,
        "summary": readiness.summary
    }


@router.get("/score", response_model=ReadinessScoreResponse)
async def get_readiness_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's overall readiness score."""
    result = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == current_user.id))
    readiness = result.scalar_one_or_none()
    
    if not readiness:
        # Create initial readiness score if it doesn't exist
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)
        await db.commit()
        await db.refresh(readiness)
    
    return map_readiness_response(readiness)


@router.get("/modules", response_model=ReadinessScoreResponse)
async def get_module_scores(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get scores for individual modules."""
    # Reuse the same response model as it contains module scores
    return await get_readiness_score(current_user, db)


@router.get("/history")
async def get_readiness_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get readiness score history (placeholder for future implementation)."""
    # For now, return the current score in a list
    score = await get_readiness_score(current_user, db)
    return [score]
