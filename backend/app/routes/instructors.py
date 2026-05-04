"""
Instructor analytics routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.evaluation import Evaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import EvaluationResponse
from app.services.auth import get_current_instructor

router = APIRouter(prefix="/instructor", tags=["Instructor Analytics"])


@router.get("/analytics/overview")
@router.get("/analytics")
async def analytics_overview(
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Aggregate analytics for instructors."""
    trainee_stmt = select(User.id).where(User.role == UserRole.TRAINEE)
    if current_user.role != UserRole.ADMIN:
        trainee_stmt = trainee_stmt.where(User.instructor_id == current_user.id)

    trainee_subq = trainee_stmt.subquery()

    total_trainees_result = await db.execute(select(func.count(trainee_subq.c.id)))
    total_trainees = total_trainees_result.scalar_one()

    evaluation_counts_result = await db.execute(
        select(Evaluation.status, func.count(Evaluation.id))
        .where(Evaluation.user_id.in_(select(trainee_subq.c.id)))
        .group_by(Evaluation.status)
    )
    evaluation_counts = {row[0].value: row[1] for row in evaluation_counts_result.all()}

    readiness_avg_result = await db.execute(
        select(func.avg(ReadinessScore.overall_score))
        .where(ReadinessScore.user_id.in_(select(trainee_subq.c.id)))
    )
    readiness_avg = readiness_avg_result.scalar_one() or 0.0

    return {
        "total_trainees": total_trainees,
        "evaluation_counts": evaluation_counts,
        "average_readiness": round(readiness_avg, 2)
    }


@router.get("/trainees/{trainee_id}/evaluations", response_model=List[EvaluationResponse])
async def list_trainee_evaluations(
    trainee_id: int,
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """List evaluations for a specific trainee."""
    trainee_query = select(User).where(User.id == trainee_id, User.role == UserRole.TRAINEE)
    if current_user.role != UserRole.ADMIN:
        trainee_query = trainee_query.where(User.instructor_id == current_user.id)

    trainee_result = await db.execute(trainee_query)
    trainee = trainee_result.scalar_one_or_none()
    if not trainee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainee not found")

    evaluations_result = await db.execute(
        select(Evaluation).where(Evaluation.user_id == trainee_id).order_by(Evaluation.created_at.desc())
    )
    return evaluations_result.scalars().all()
