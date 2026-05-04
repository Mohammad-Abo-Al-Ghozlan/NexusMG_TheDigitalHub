"""
CV Evaluation Routes
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import os
import uuid
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationType, EvaluationStatus, CVEvaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import EvaluationResponse, CVAnalysisResponse
from app.services.auth import get_current_user
from app.services.ai import cv_parser, groq_service
from app.services.readiness import calculate_overall_readiness
from app.config import settings
from app.rate_limiter import limiter

router = APIRouter(prefix="/evaluations/cv", tags=["CV Evaluation"])


@router.post("/upload", response_model=EvaluationResponse)
@limiter.limit("5/minute")
async def upload_cv(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload CV file for evaluation."""
    # Validate file type
    allowed_types = {
        ".pdf": {"application/pdf"},
        ".docx": {"application/vnd.openxmlformats-officedocument.wordprocessingml.document"},
        ".txt": {"text/plain"}
    }
    ext = os.path.splitext(file.filename)[1].lower()

    if ext not in allowed_types or file.content_type not in allowed_types[ext]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_types.keys())}"
        )
    
    # Save file
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    
    file_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, file_name)

    size = 0
    import aiofiles
    async with aiofiles.open(file_path, "wb") as f:
        while chunk := await file.read(1024 * 1024):
            size += len(chunk)
            if size > settings.MAX_FILE_SIZE:
                await f.close() # Important: close before removing
                if os.path.exists(file_path):
                    os.remove(file_path)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
                )
            await f.write(chunk)
    
    # Create evaluation record
    evaluation = Evaluation(
        user_id=current_user.id,
        evaluation_type=EvaluationType.CV,
        status=EvaluationStatus.IN_PROGRESS,
        file_path=file_path
    )
    
    db.add(evaluation)
    await db.commit()
    await db.refresh(evaluation)
    
    return evaluation


@router.post("/{evaluation_id}/analyze", response_model=CVAnalysisResponse)
@limiter.limit("10/minute")
async def analyze_cv(
    request: Request,
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Analyze uploaded CV."""
    # Get evaluation
    result = await db.execute(
        select(Evaluation).where(
            Evaluation.id == evaluation_id,
            Evaluation.user_id == current_user.id,
            Evaluation.evaluation_type == EvaluationType.CV
        )
    )
    evaluation = result.scalar_one_or_none()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found"
        )
    
    if not evaluation.file_path:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded for this evaluation"
        )
    
    # Parse CV
    parsed_data = await cv_parser.analyze_cv(evaluation.file_path)
    
    if not parsed_data.get("success"):
        evaluation.status = EvaluationStatus.FAILED
        evaluation.feedback = parsed_data.get("error", "Failed to parse CV")
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=parsed_data.get("error", "Failed to parse CV")
        )
    
    # AI Analysis
    try:
        ai_analysis = await groq_service.analyze_cv(
            cv_text=parsed_data.get("text", ""),
            skills=parsed_data.get("skills", {}).get("all", []),
            experience=parsed_data.get("experience", []),
            education=parsed_data.get("education", [])
        )
    except Exception as exc:
        evaluation.status = EvaluationStatus.FAILED
        evaluation.feedback = f"AI error: {exc}"
        await db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI analysis failed")
    
    # Calculate overall score
    overall_score = (
        ai_analysis.get("format_score", 0) * 0.2 +
        ai_analysis.get("content_score", 0) * 0.3 +
        ai_analysis.get("skills_score", 0) * 0.25 +
        ai_analysis.get("experience_score", 0) * 0.25
    )
    
    # Update evaluation
    evaluation.status = EvaluationStatus.COMPLETED
    evaluation.score = overall_score
    evaluation.analysis = ai_analysis
    evaluation.feedback = ai_analysis.get("feedback", "")
    evaluation.recommendations = ai_analysis.get("recommendations", [])
    evaluation.completed_at = datetime.now(timezone.utc)
    
    # Create CV-specific record
    cv_eval = CVEvaluation(
        evaluation_id=evaluation.id,
        extracted_text=parsed_data.get("text", ""),
        skills=parsed_data.get("skills", {}),
        experience=parsed_data.get("experience", []),
        education=parsed_data.get("education", []),
        format_score=ai_analysis.get("format_score", 0),
        content_score=ai_analysis.get("content_score", 0),
        skills_score=ai_analysis.get("skills_score", 0),
        experience_score=ai_analysis.get("experience_score", 0)
    )
    
    db.add(cv_eval)
    
    # Update readiness score
    readiness_result = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == current_user.id))
    readiness = readiness_result.scalar_one_or_none()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)

    readiness.cv_score = overall_score
    readiness.cv_completed = True
    readiness.overall_score = calculate_overall_readiness(readiness)

    await db.commit()
    
    return CVAnalysisResponse(
        format_score=ai_analysis.get("format_score", 0),
        content_score=ai_analysis.get("content_score", 0),
        skills_score=ai_analysis.get("skills_score", 0),
        experience_score=ai_analysis.get("experience_score", 0),
        overall_score=overall_score,
        skills=parsed_data.get("skills", {}).get("all", []),
        experience=parsed_data.get("experience", []),
        education=parsed_data.get("education", []),
        feedback=ai_analysis.get("feedback", ""),
        recommendations=ai_analysis.get("recommendations", [])
    )


@router.get("/latest", response_model=EvaluationResponse)
async def get_latest_cv_evaluation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the latest CV evaluation."""
    result = await db.execute(
        select(Evaluation).where(
            Evaluation.user_id == current_user.id,
            Evaluation.evaluation_type == EvaluationType.CV
        ).order_by(Evaluation.created_at.desc())
    )
    evaluation = result.scalars().first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No CV evaluation found"
        )
    
    return evaluation
