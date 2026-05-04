"""
Evaluation history and detail routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional, List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.evaluation import Evaluation, EvaluationType, EvaluationStatus
from app.schemas.evaluation import EvaluationResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


@router.get("", response_model=List[EvaluationResponse])
async def list_evaluations(
    evaluation_type: Optional[EvaluationType] = None,
    status_filter: Optional[EvaluationStatus] = None,
    user_id: Optional[int] = None,
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List evaluations with optional filters."""
    limit = min(max(limit, 1), 100)

    if user_id and current_user.role in [UserRole.INSTRUCTOR, UserRole.ADMIN]:
        if current_user.role == UserRole.INSTRUCTOR:
            trainee_result = await db.execute(
                select(User).where(User.id == user_id, User.role == UserRole.TRAINEE, User.instructor_id == current_user.id)
            )
            if trainee_result.scalar_one_or_none() is None:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        target_user_id = user_id
    else:
        target_user_id = current_user.id

    stmt = select(Evaluation).where(Evaluation.user_id == target_user_id)
    if evaluation_type:
        stmt = stmt.where(Evaluation.evaluation_type == evaluation_type)
    if status_filter:
        stmt = stmt.where(Evaluation.status == status_filter)

    stmt = stmt.order_by(Evaluation.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{evaluation_id}", response_model=EvaluationResponse)
async def get_evaluation(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific evaluation by id."""
    result = await db.execute(select(Evaluation).where(Evaluation.id == evaluation_id))
    evaluation = result.scalar_one_or_none()

    if not evaluation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluation not found")

    if evaluation.user_id != current_user.id:
        if current_user.role == UserRole.INSTRUCTOR:
            trainee_result = await db.execute(
                select(User).where(User.id == evaluation.user_id, User.instructor_id == current_user.id)
            )
            if trainee_result.scalar_one_or_none() is None:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        elif current_user.role != UserRole.ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    return evaluation
