"""
CV Evaluation Routes
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from datetime import datetime
import os
import uuid
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationType, EvaluationStatus, CVEvaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import EvaluationResponse, CVAnalysisResponse
from app.services.auth import get_current_user
from app.services.ai import cv_parser, groq_service
from app.config import settings

router = APIRouter(prefix="/evaluations/cv", tags=["CV Evaluation"])


@router.post("/upload", response_model=EvaluationResponse)
async def upload_cv(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload CV file for evaluation."""
    # Validate file type
    allowed_types = [".pdf", ".docx", ".doc", ".txt"]
    ext = os.path.splitext(file.filename)[1].lower()
    
    if ext not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(allowed_types)}"
        )
    
    # Validate file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / 1024 / 1024}MB"
        )
    
    # Save file
    upload_dir = os.path.join(settings.UPLOAD_DIR, str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    
    file_name = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(upload_dir, file_name)
    
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Create evaluation record
    evaluation = Evaluation(
        user_id=current_user.id,
        evaluation_type=EvaluationType.CV,
        status=EvaluationStatus.IN_PROGRESS,
        file_path=file_path
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    return evaluation


@router.post("/{evaluation_id}/analyze", response_model=CVAnalysisResponse)
async def analyze_cv(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze uploaded CV."""
    # Get evaluation
    evaluation = db.query(Evaluation).filter(
        Evaluation.id == evaluation_id,
        Evaluation.user_id == current_user.id,
        Evaluation.evaluation_type == EvaluationType.CV
    ).first()
    
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
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=parsed_data.get("error", "Failed to parse CV")
        )
    
    # AI Analysis
    ai_analysis = await groq_service.analyze_cv(
        cv_text=parsed_data.get("text", ""),
        skills=parsed_data.get("skills", {}).get("all", []),
        experience=parsed_data.get("experience", []),
        education=parsed_data.get("education", [])
    )
    
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
    evaluation.completed_at = datetime.utcnow()
    
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
    readiness = db.query(ReadinessScore).filter(
        ReadinessScore.user_id == current_user.id
    ).first()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)
    
    readiness.cv_score = overall_score
    readiness.cv_completed = 1
    readiness.overall_score = _calculate_overall_readiness(readiness)
    
    db.commit()
    
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
    db: Session = Depends(get_db)
):
    """Get the latest CV evaluation."""
    evaluation = db.query(Evaluation).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.evaluation_type == EvaluationType.CV
    ).order_by(Evaluation.created_at.desc()).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No CV evaluation found"
        )
    
    return evaluation


def _calculate_overall_readiness(readiness: ReadinessScore) -> float:
    """Calculate overall readiness score."""
    scores = []
    
    if readiness.cv_completed:
        scores.append(readiness.cv_score)
    if readiness.github_completed:
        scores.append(readiness.github_score)
    if readiness.linkedin_completed:
        scores.append(readiness.linkedin_score)
    if readiness.idea_completed:
        scores.append(readiness.idea_score)
    if readiness.interview_completed:
        scores.append(readiness.interview_score)
    if readiness.english_completed:
        scores.append(readiness.english_score)
    
    if not scores:
        return 0.0
    
    return sum(scores) / len(scores)
