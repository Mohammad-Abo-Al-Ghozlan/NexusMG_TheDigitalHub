"""
Idea Evaluation Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.evaluation import Evaluation, EvaluationType, EvaluationStatus, IdeaEvaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import EvaluationResponse, IdeaSubmit, IdeaAnalysisResponse
from app.services.auth import get_current_user
from app.services.ai import groq_service

router = APIRouter(prefix="/evaluations/idea", tags=["Idea Evaluation"])


@router.post("/analyze", response_model=IdeaAnalysisResponse)
async def analyze_idea(
    data: IdeaSubmit,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Analyze a project/startup idea."""
    # Create evaluation record
    evaluation = Evaluation(
        user_id=current_user.id,
        evaluation_type=EvaluationType.IDEA,
        status=EvaluationStatus.IN_PROGRESS,
        input_data=data.model_dump()
    )
    
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    # AI Analysis
    ai_analysis = await groq_service.analyze_idea({
        "title": data.title,
        "description": data.description,
        "problem_statement": data.problem_statement,
        "target_audience": data.target_audience,
        "tech_stack": data.tech_stack
    })
    
    # Calculate overall score
    overall_score = (
        ai_analysis.get("innovation_score", 0) * 0.25 +
        ai_analysis.get("feasibility_score", 0) * 0.25 +
        ai_analysis.get("market_score", 0) * 0.25 +
        ai_analysis.get("technical_score", 0) * 0.25
    )
    
    # Update evaluation
    evaluation.status = EvaluationStatus.COMPLETED
    evaluation.score = overall_score
    evaluation.analysis = ai_analysis
    evaluation.feedback = ai_analysis.get("feedback", "")
    evaluation.recommendations = ai_analysis.get("recommendations", [])
    evaluation.completed_at = datetime.utcnow()
    
    # Create Idea-specific record
    idea_eval = IdeaEvaluation(
        evaluation_id=evaluation.id,
        title=data.title,
        description=data.description,
        problem_statement=data.problem_statement,
        target_audience=data.target_audience,
        tech_stack=data.tech_stack,
        innovation_score=ai_analysis.get("innovation_score", 0),
        feasibility_score=ai_analysis.get("feasibility_score", 0),
        market_score=ai_analysis.get("market_score", 0),
        technical_score=ai_analysis.get("technical_score", 0)
    )
    
    db.add(idea_eval)
    
    # Update readiness score
    readiness = db.query(ReadinessScore).filter(
        ReadinessScore.user_id == current_user.id
    ).first()
    
    if not readiness:
        readiness = ReadinessScore(user_id=current_user.id)
        db.add(readiness)
    
    readiness.idea_score = overall_score
    readiness.idea_completed = 1
    readiness.overall_score = _calculate_overall_readiness(readiness)
    
    db.commit()
    
    return IdeaAnalysisResponse(
        innovation_score=ai_analysis.get("innovation_score", 0),
        feasibility_score=ai_analysis.get("feasibility_score", 0),
        market_score=ai_analysis.get("market_score", 0),
        technical_score=ai_analysis.get("technical_score", 0),
        overall_score=overall_score,
        swot_analysis=ai_analysis.get("swot_analysis", {}),
        feedback=ai_analysis.get("feedback", ""),
        recommendations=ai_analysis.get("recommendations", [])
    )


@router.get("/latest", response_model=EvaluationResponse)
async def get_latest_idea_evaluation(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get the latest Idea evaluation."""
    evaluation = db.query(Evaluation).filter(
        Evaluation.user_id == current_user.id,
        Evaluation.evaluation_type == EvaluationType.IDEA
    ).order_by(Evaluation.created_at.desc()).first()
    
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Idea evaluation found"
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
