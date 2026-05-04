"""
GitHub Evaluation Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationType, EvaluationStatus, GitHubEvaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import EvaluationResponse, GitHubSubmit, GitHubAnalysisResponse
from app.services.auth import get_current_user
from app.services.ai import github_service, groq_service
from app.services.readiness import calculate_overall_readiness
from app.rate_limiter import limiter

router = APIRouter(prefix="/evaluations/github", tags=["GitHub Evaluation"])


@router.post("/analyze", response_model=GitHubAnalysisResponse)
@limiter.limit("10/minute")
async def analyze_github(
    request: Request,
    data: GitHubSubmit,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
    await db.commit()
    await db.refresh(evaluation)
    
    # Fetch GitHub data
    github_data = await github_service.analyze_profile(data.username)
    
    if github_data.get("error"):
        evaluation.status = EvaluationStatus.FAILED
        evaluation.feedback = github_data.get("error")
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=github_data.get("error")
        )
    
    # AI Analysis
    try:
        ai_analysis = await groq_service.analyze_github(
            profile=github_data.get("profile", {}),
            repositories=github_data.get("repositories", []),
            languages=github_data.get("languages", {})
        )
    except Exception as exc:
        evaluation.status = EvaluationStatus.FAILED
        evaluation.feedback = f"AI error: {exc}"
        await db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="AI analysis failed")
    
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
    evaluation.completed_at = datetime.now(timezone.utc)
    
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
    readiness_result = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == current_user.id))
    readiness = readiness_result.scalar_one_or_none()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)

    readiness.github_score = overall_score
    readiness.github_completed = True
    readiness.overall_score = calculate_overall_readiness(readiness)

    await db.commit()
    
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
    db: AsyncSession = Depends(get_db)
):
    """Get the latest GitHub evaluation."""
    result = await db.execute(
        select(Evaluation).where(
            Evaluation.user_id == current_user.id,
            Evaluation.evaluation_type == EvaluationType.GITHUB
        ).order_by(Evaluation.created_at.desc())
    )
    evaluation = result.scalars().first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No GitHub evaluation found"
        )
    
    return evaluation
