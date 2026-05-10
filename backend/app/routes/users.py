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
from app.models.evaluation import Evaluation
from fastapi.responses import StreamingResponse
from app.utils.pdf_generator import generate_trainee_report_pdf
from app.schemas.user import UserResponse, UserUpdate, PasswordUpdate, OnboardingQuestionsResponse, OnboardingSubmission
from app.schemas.evaluation import ReadinessScoreResponse
from app.services.ai.groq_service import groq_service
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


@router.get("/me/export")
async def export_my_report(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Export current trainee's report as PDF."""
    if current_user.role != UserRole.TRAINEE:
        raise HTTPException(status_code=403, detail="Only trainees can export their own reports")
        
    score_res = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == current_user.id))
    score = score_res.scalar_one_or_none()
    
    evals_res = await db.execute(
        select(Evaluation).where(Evaluation.user_id == current_user.id).order_by(Evaluation.created_at.desc())
    )
    evaluations = evals_res.scalars().all()
    
    pdf_buffer = generate_trainee_report_pdf(current_user, score, evaluations)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=my_report.pdf"}
    )


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


@router.get("/me/onboarding-questions", response_model=OnboardingQuestionsResponse)
async def get_onboarding_questions(current_user: User = Depends(get_current_user)):
    """Get AI-generated onboarding questions."""
    if current_user.is_onboarded:
        raise HTTPException(status_code=400, detail="User is already onboarded")
        
    questions = await groq_service.generate_onboarding_questions()
    return OnboardingQuestionsResponse(questions=questions)


@router.post("/me/onboard", response_model=UserResponse)
async def submit_onboarding(
    submission: OnboardingSubmission,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit onboarding answers and establish baseline."""
    if current_user.is_onboarded:
        raise HTTPException(status_code=400, detail="User is already onboarded")
        
    # Convert submission to a list of dicts for the AI service
    answers = [ans.model_dump() for ans in submission.answers]
    
    # Analyze answers
    analysis = await groq_service.analyze_onboarding_answers(answers)
    
    # Update user profile
    current_user.is_onboarded = True
    current_user.onboarding_summary = analysis.get("summary", "")
    
    # Create or update an initial readiness score
    baseline_score = float(analysis.get("estimated_baseline_score", 0))
    
    score_result = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == current_user.id))
    existing_score = score_result.scalar_one_or_none()
    
    if existing_score:
        if not existing_score.cv_completed:
            existing_score.cv_score = baseline_score
        if not existing_score.github_completed:
            existing_score.github_score = baseline_score
        if not existing_score.linkedin_completed:
            existing_score.linkedin_score = baseline_score
        if not existing_score.interview_completed:
            existing_score.interview_score = baseline_score
        if not existing_score.english_completed:
            existing_score.english_score = baseline_score
        if not existing_score.idea_completed:
            existing_score.idea_score = baseline_score
            
        # Re-calculate overall score if needed, or leave it to the calculate_overall_readiness service
        from app.services.readiness import calculate_overall_readiness
        await calculate_overall_readiness(current_user.id, db)
    else:
        initial_score = ReadinessScore(
            user_id=current_user.id,
            overall_score=baseline_score,
            github_score=baseline_score,
            cv_score=baseline_score,
            linkedin_score=baseline_score,
            interview_score=baseline_score,
            english_score=baseline_score,
            idea_score=baseline_score
        )
        db.add(initial_score)
    
    await db.commit()
    await db.refresh(current_user)
    
    return current_user


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
