"""
User Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User, UserRole
from app.models.readiness import ReadinessScore
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.evaluation import ReadinessScoreResponse
from app.services.auth import get_current_user, get_current_instructor

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user profile."""
    update_dict = update_data.model_dump(exclude_unset=True)
    
    for field, value in update_dict.items():
        setattr(current_user, field, value)
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.get("/me/readiness", response_model=ReadinessScoreResponse)
async def get_readiness_score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's readiness score."""
    readiness = db.query(ReadinessScore).filter(
        ReadinessScore.user_id == current_user.id
    ).first()
    
    if not readiness:
        # Create initial readiness score
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)
        db.commit()
        db.refresh(readiness)
    
    return readiness


@router.get("/trainees", response_model=List[UserResponse])
async def list_trainees(
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """List all trainees (Instructor only)."""
    trainees = db.query(User).filter(User.role == UserRole.TRAINEE).all()
    return trainees


@router.get("/trainees/{trainee_id}", response_model=UserResponse)
async def get_trainee(
    trainee_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """Get trainee details (Instructor only)."""
    trainee = db.query(User).filter(
        User.id == trainee_id,
        User.role == UserRole.TRAINEE
    ).first()
    
    if not trainee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee not found"
        )
    
    return trainee


@router.get("/trainees/{trainee_id}/readiness", response_model=ReadinessScoreResponse)
async def get_trainee_readiness(
    trainee_id: int,
    current_user: User = Depends(get_current_instructor),
    db: Session = Depends(get_db)
):
    """Get trainee's readiness score (Instructor only)."""
    trainee = db.query(User).filter(
        User.id == trainee_id,
        User.role == UserRole.TRAINEE
    ).first()
    
    if not trainee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee not found"
        )
    
    readiness = db.query(ReadinessScore).filter(
        ReadinessScore.user_id == trainee_id
    ).first()
    
    if not readiness:
        readiness = ReadinessScore(user_id=trainee_id)
        db.add(readiness)
        db.commit()
        db.refresh(readiness)
    
    return readiness
