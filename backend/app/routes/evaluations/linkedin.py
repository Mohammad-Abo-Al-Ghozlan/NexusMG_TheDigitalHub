"""
LinkedIn Evaluation Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationType, EvaluationStatus, LinkedInEvaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import EvaluationResponse, LinkedInSubmit, LinkedInAnalysisResponse
from app.services.auth import get_current_user
from app.services.ai import linkedin_service, groq_service

router = APIRouter(prefix="/evaluations/linkedin", tags=["LinkedIn Evaluation"])


@router.post("/analyze", response_model=LinkedInAnalysisResponse)
async def analyze_linkedin(
    data: LinkedInSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze LinkedIn profile (auto-fetch or manual entry)."""
    # Create evaluation record
    evaluation = Evaluation(
        user_id=current_user.id,
        evaluation_type=EvaluationType.LINKEDIN,
        status=EvaluationStatus.IN_PROGRESS,
        input_data={
            "profile_url": data.profile_url,
            "is_manual": data.manual_data is not None
        }
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    profile_data = None
    is_manual = False
    
    # Try auto-fetch first if URL provided
    if data.profile_url:
        profile_data = await linkedin_service.fetch_profile(data.profile_url)
        
        if profile_data and not profile_data.get("error"):
            current_user.linkedin_url = data.profile_url
        else:
            profile_data = None
    
    # Fall back to manual data
    if not profile_data and data.manual_data:
        profile_data = linkedin_service.validate_manual_profile(data.manual_data)
        is_manual = True
    
    if not profile_data:
        evaluation.status = EvaluationStatus.FAILED
        evaluation.feedback = "Could not fetch LinkedIn profile. Please provide manual data."
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not fetch LinkedIn profile and no manual data provided"
        )
    
    # Calculate completeness
    completeness = linkedin_service.calculate_profile_completeness(profile_data)
    
    # AI Analysis
    ai_analysis = await groq_service.analyze_linkedin(profile_data)
    
    # Calculate overall score
    overall_score = (
        ai_analysis.get("completeness_score", 0) * 0.4 +
        ai_analysis.get("network_score", 0) * 0.3 +
        ai_analysis.get("engagement_score", 0) * 0.3
    )
    
    # Update evaluation
    evaluation.status = EvaluationStatus.COMPLETED
    evaluation.score = overall_score
    evaluation.analysis = ai_analysis
    evaluation.feedback = ai_analysis.get("feedback", "")
    evaluation.recommendations = ai_analysis.get("recommendations", [])
    evaluation.completed_at = datetime.utcnow()
    
    # Create LinkedIn-specific record
    linkedin_eval = LinkedInEvaluation(
        evaluation_id=evaluation.id,
        profile_url=data.profile_url,
        profile_data=profile_data,
        is_manual_entry=1 if is_manual else 0,
        completeness_score=ai_analysis.get("completeness_score", 0),
        network_score=ai_analysis.get("network_score", 0),
        engagement_score=ai_analysis.get("engagement_score", 0)
    )
    
    db.add(linkedin_eval)
    
    # Update readiness score
    readiness = db.query(ReadinessScore).filter(
        ReadinessScore.user_id == current_user.id
    ).first()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)
    
    readiness.linkedin_score = overall_score
    readiness.linkedin_completed = 1
    readiness.overall_score = _calculate_overall_readiness(readiness)
    
    db.commit()
    
    return LinkedInAnalysisResponse(
        completeness_score=ai_analysis.get("completeness_score", 0),
        network_score=ai_analysis.get("network_score", 0),
        engagement_score=ai_analysis.get("engagement_score", 0),
        overall_score=overall_score,
        profile_data=profile_data,
        feedback=ai_analysis.get("feedback", ""),
        recommendations=ai_analysis.get("recommendations", [])
    )


@router.get("/latest", response_model=EvaluationResponse)
async def get_latest_linkedin_evaluation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the latest LinkedIn evaluation."""
    evaluation = db.query(Evaluation).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.evaluation_type == EvaluationType.LINKEDIN
    ).order_by(Evaluation.created_at.desc()).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No LinkedIn evaluation found"
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
