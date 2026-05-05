"""
User Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import os
import uuid
import aiofiles
from app.database import get_db
from app.models.user import User, UserRole
from app.models.readiness import ReadinessScore
from app.schemas.user import UserResponse, UserUpdate, PasswordUpdate
from app.schemas.evaluation import ReadinessScoreResponse
from app.services.auth import get_current_user, get_current_instructor, get_current_admin, hash_password, verify_password
from app.services.readiness import calculate_overall_readiness, generate_readiness_summary
from app.config import settings

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user profile."""
    update_dict = update_data.model_dump(exclude_unset=True)

    # Email update needs uniqueness check
    new_email = update_dict.get("email")
    if new_email and new_email != current_user.email:
        existing = await db.execute(select(User).where(User.email == new_email))
        if existing.scalar_one_or_none() is not None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    
    for field, value in update_dict.items():
        setattr(current_user, field, value)
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.post("/me/avatar", response_model=UserResponse)
async def update_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's avatar."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must be an image")
    
    ext = os.path.splitext(file.filename)[1].lower()
    if not ext:
        ext = ".png" # default
    
    # Save file
    avatar_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)
    
    file_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(avatar_dir, file_name)
    
    async with aiofiles.open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            await f.write(chunk)
    
    # Update user record (storing relative path for simplicity or full URL if configured)
    # For now, let's just store the filename or path
    current_user.avatar_url = f"/api/v1/users/avatar/{file_name}"
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


@router.put("/me/password", status_code=status.HTTP_200_OK)
async def change_password(
    password_data: PasswordUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Change current user password."""
    if not verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.hashed_password = hash_password(password_data.new_password)
    await db.commit()
    
    return {"message": "Password updated successfully"}


@router.get("/me/readiness", response_model=ReadinessScoreResponse)
async def get_readiness_score(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's readiness score."""
    result = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == current_user.id))
    readiness = result.scalar_one_or_none()
    
    if not readiness:
        # Create initial readiness score
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)
        await db.commit()
        await db.refresh(readiness)
    
    return readiness


@router.post("/me/readiness/recalculate", response_model=ReadinessScoreResponse)
async def recalculate_readiness_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Recalculate readiness summary and recommendations."""
    result = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == current_user.id))
    readiness = result.scalar_one_or_none()

    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)

    readiness.overall_score = calculate_overall_readiness(readiness)

    try:
        summary = await generate_readiness_summary(readiness, current_user)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"AI summary failed: {exc}")
    
    readiness.strengths = summary.get("strengths")
    readiness.weaknesses = summary.get("weaknesses")
    readiness.recommendations = summary.get("recommendations")
    readiness.career_suggestions = summary.get("career_suggestions")
    readiness.summary = summary.get("summary")

    await db.commit()
    await db.refresh(readiness)

    return readiness


@router.get("/trainees", response_model=List[UserResponse])
async def list_all_trainees(
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """List all trainees (Instructor only)."""
    stmt = select(User).where(User.role == UserRole.TRAINEE)
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(User.instructor_id == current_user.id)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/trainees/{trainee_id}", response_model=UserResponse)
async def get_trainee(
    trainee_id: int,
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Get trainee details (Instructor only)."""
    stmt = select(User).where(
        User.id == trainee_id,
        User.role == UserRole.TRAINEE
    )
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(User.instructor_id == current_user.id)
    result = await db.execute(stmt)
    trainee = result.scalar_one_or_none()
    
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
    db: AsyncSession = Depends(get_db)
):
    """Get trainee's readiness score (Instructor only)."""
    stmt = select(User).where(
        User.id == trainee_id,
        User.role == UserRole.TRAINEE
    )
    if current_user.role != UserRole.ADMIN:
        stmt = stmt.where(User.instructor_id == current_user.id)
    result = await db.execute(stmt)
    trainee = result.scalar_one_or_none()
    
    if not trainee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee not found"
        )
    
    readiness_result = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == trainee_id))
    readiness = readiness_result.scalar_one_or_none()
    
    if not readiness:
        readiness = ReadinessScore(user_id=trainee_id)
        db.add(readiness)
        await db.commit()
        await db.refresh(readiness)
    
    return readiness


@router.post("/trainees/{trainee_id}/assign/{instructor_id}", response_model=UserResponse)
async def assign_trainee(
    trainee_id: int,
    instructor_id: int,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Assign a trainee to an instructor (Admin only)."""
    trainee_result = await db.execute(select(User).where(User.id == trainee_id, User.role == UserRole.TRAINEE))
    trainee = trainee_result.scalar_one_or_none()

    instructor_result = await db.execute(select(User).where(User.id == instructor_id, User.role == UserRole.INSTRUCTOR))
    instructor = instructor_result.scalar_one_or_none()

    if not trainee or not instructor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Trainee or instructor not found"
        )

    trainee.instructor_id = instructor.id
    await db.commit()
    await db.refresh(trainee)

    return trainee


@router.get("/avatar/{filename}", tags=["Users"])
async def get_avatar(filename: str):
    """Serve user avatars."""
    import os
    from fastapi.responses import FileResponse
    file_path = os.path.join(settings.UPLOAD_DIR, "avatars", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Avatar not found")
    
    return FileResponse(file_path)
