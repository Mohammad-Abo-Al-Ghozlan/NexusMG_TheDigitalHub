"""
GitHub Evaluation Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationType, EvaluationStatus, GitHubEvaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import EvaluationResponse, GitHubSubmit, GitHubAnalysisResponse
from app.services.auth import get_current_user
from app.services.ai import github_service, groq_service

router = APIRouter(prefix="/evaluations/github", tags=["GitHub Evaluation"])


@router.post("/analyze", response_model=GitHubAnalysisResponse)
async def analyze_github(
    data: GitHubSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze GitHub profile."""
    # Create evaluation record
    evaluation = Evaluation(
        user_id=current_user.id,
        evaluation_type=EvaluationType.GITHUB,
        status=EvaluationStatus.IN_PROGRESS,
        input_data={"username": data.username}
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    # Fetch GitHub data
    github_data = await github_service.analyze_profile(data.username)
    
    if github_data.get("error"):
        evaluation.status = EvaluationStatus.FAILED
        evaluation.feedback = github_data.get("error")
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=github_data.get("error")
        )
    
    # AI Analysis
    ai_analysis = await groq_service.analyze_github(
        profile=github_data.get("profile", {}),
        repositories=github_data.get("repositories", []),
        languages=github_data.get("languages", {})
    )
    
    # Calculate overall score
    overall_score = (
        ai_analysis.get("activity_score", 0) * 0.3 +
        ai_analysis.get("code_quality_score", 0) * 0.3 +
        ai_analysis.get("diversity_score", 0) * 0.2 +
        ai_analysis.get("documentation_score", 0) * 0.2
    )
    
    # Update evaluation
    evaluation.status = EvaluationStatus.COMPLETED
    evaluation.score = overall_score
    evaluation.analysis = ai_analysis
    evaluation.feedback = ai_analysis.get("feedback", "")
    evaluation.recommendations = ai_analysis.get("recommendations", [])
    evaluation.completed_at = datetime.utcnow()
    
    # Create GitHub-specific record
    github_eval = GitHubEvaluation(
        evaluation_id=evaluation.id,
        username=data.username,
        profile_data=github_data.get("profile"),
        repositories=github_data.get("repositories"),
        activity_score=ai_analysis.get("activity_score", 0),
        code_quality_score=ai_analysis.get("code_quality_score", 0),
        diversity_score=ai_analysis.get("diversity_score", 0),
        documentation_score=ai_analysis.get("documentation_score", 0)
    )
    
    db.add(github_eval)
    
    # Update user's GitHub username
    current_user.github_username = data.username
    
    # Update readiness score
    readiness = db.query(ReadinessScore).filter(
        ReadinessScore.user_id == current_user.id
    ).first()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)
    
    readiness.github_score = overall_score
    readiness.github_completed = 1
    readiness.overall_score = _calculate_overall_readiness(readiness)
    
    db.commit()
    
    return GitHubAnalysisResponse(
        activity_score=ai_analysis.get("activity_score", 0),
        code_quality_score=ai_analysis.get("code_quality_score", 0),
        diversity_score=ai_analysis.get("diversity_score", 0),
        documentation_score=ai_analysis.get("documentation_score", 0),
        overall_score=overall_score,
        profile=github_data.get("profile", {}),
        top_repositories=github_data.get("repositories", [])[:5],
        languages=github_data.get("languages", {}),
        feedback=ai_analysis.get("feedback", ""),
        recommendations=ai_analysis.get("recommendations", [])
    )


@router.get("/latest", response_model=EvaluationResponse)
async def get_latest_github_evaluation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the latest GitHub evaluation."""
    evaluation = db.query(Evaluation).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.evaluation_type == EvaluationType.GITHUB
    ).order_by(Evaluation.created_at.desc()).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No GitHub evaluation found"
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
