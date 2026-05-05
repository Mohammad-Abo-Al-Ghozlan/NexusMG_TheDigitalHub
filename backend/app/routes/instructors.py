"""
Instructor analytics routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
import io
import csv
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Dict, Any
from app.database import get_db
from app.models.user import User, UserRole
from app.models.evaluation import Evaluation
from app.models.readiness import ReadinessScore
from app.schemas.evaluation import EvaluationResponse
from app.services.auth import get_current_instructor

router = APIRouter(prefix="/instructor", tags=["Instructor Analytics"])


@router.get("/analytics/overview")
@router.get("/analytics")
async def analytics_overview(
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Aggregate analytics for instructors."""
    trainee_stmt = select(User.id).where(User.role == UserRole.TRAINEE)
    if current_user.role != UserRole.ADMIN:
        trainee_stmt = trainee_stmt.where(User.instructor_id == current_user.id)

    trainee_subq = trainee_stmt.subquery()

    total_trainees_result = await db.execute(select(func.count(trainee_subq.c.id)))
    total_trainees = total_trainees_result.scalar_one()

    evaluation_counts_result = await db.execute(
        select(Evaluation.status, func.count(Evaluation.id))
        .where(Evaluation.user_id.in_(select(trainee_subq.c.id)))
        .group_by(Evaluation.status)
    )
    evaluation_counts = {row[0].value: row[1] for row in evaluation_counts_result.all()}

    readiness_avg_result = await db.execute(
        select(func.avg(ReadinessScore.overall_score))
        .where(ReadinessScore.user_id.in_(select(trainee_subq.c.id)))
    )
    readiness_avg = readiness_avg_result.scalar_one() or 0.0

    # Module Averages
    module_avgs = {}
    for module in ["cv", "github", "linkedin", "idea", "interview", "english"]:
        col = getattr(ReadinessScore, f"{module}_score")
        res = await db.execute(
            select(func.avg(col)).where(ReadinessScore.user_id.in_(select(trainee_subq.c.id)))
        )
        module_avgs[module] = round(res.scalar_one() or 0.0, 2)

    # Distribution
    dist = {"beginner": 0, "intermediate": 0, "advanced": 0, "expert": 0}
    scores_res = await db.execute(
        select(ReadinessScore.overall_score).where(ReadinessScore.user_id.in_(select(trainee_subq.c.id)))
    )
    for score in scores_res.scalars():
        if score >= 75: dist["expert"] += 1
        elif score >= 50: dist["advanced"] += 1
        elif score >= 25: dist["intermediate"] += 1
        else: dist["beginner"] += 1

    return {
        "totalTrainees": total_trainees,
        "averageReadiness": round(readiness_avg, 2),
        "evaluation_counts": evaluation_counts,
        "moduleAverages": module_avgs,
        "distribution": dist,
        "traineesProgress": {
            "improving": total_trainees, # Placeholder
            "stable": 0,
            "needsAttention": 0
        },
        "weeklyActivity": {
            "evaluationsCompleted": sum(evaluation_counts.values()),
            "averageScore": round(readiness_avg, 2),
            "topPerformers": dist["expert"]
        }
    }


@router.get("/trainees")
async def list_instructor_trainees(
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """List all trainees assigned to this instructor."""
    query = select(User).where(User.role == UserRole.TRAINEE)
    if current_user.role != UserRole.ADMIN:
        query = query.where(User.instructor_id == current_user.id)
    
    result = await db.execute(query)
    trainees = result.scalars().all()
    
    # Enrich with readiness scores
    enriched = []
    for t in trainees:
        score_res = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == t.id))
        score = score_res.scalar_one_or_none()
        enriched.append({
            "id": t.id,
            "full_name": t.full_name,
            "email": t.email,
            "avatar_url": t.avatar_url,
            "readiness_score": round(score.overall_score, 2) if score else 0,
            "last_active": t.updated_at
        })
    return enriched


@router.get("/trainees/{trainee_id}")
async def get_instructor_trainee_details(
    trainee_id: int,
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed profile and scores for a trainee."""
    query = select(User).where(User.id == trainee_id, User.role == UserRole.TRAINEE)
    if current_user.role != UserRole.ADMIN:
        query = query.where(User.instructor_id == current_user.id)
    
    result = await db.execute(query)
    trainee = result.scalar_one_or_none()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")
        
    # Get readiness score
    score_res = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == trainee.id))
    score = score_res.scalar_one_or_none()
    
    # Get evaluations
    evals_res = await db.execute(
        select(Evaluation).where(Evaluation.user_id == trainee.id).order_by(Evaluation.created_at.desc())
    )
    evaluations = evals_res.scalars().all()
    
    # Format for frontend
    return {
        "id": str(trainee.id),
        "full_name": trainee.full_name,
        "email": trainee.email,
        "avatar_url": trainee.avatar_url,
        "created_at": trainee.created_at.isoformat() if trainee.created_at else None,
        "last_active": trainee.updated_at.isoformat() if trainee.updated_at else None,
        "readiness_score": round(score.overall_score, 2) if score else 0,
        "status": "improving" if score and score.overall_score > 70 else "stable",
        "modules": {
            "cv": round(score.cv_score, 2) if score else 0,
            "github": round(score.github_score, 2) if score else 0,
            "linkedin": round(score.linkedin_score, 2) if score else 0,
            "idea": round(score.idea_score, 2) if score else 0,
            "interview": round(score.interview_score, 2) if score else 0,
            "english": round(score.english_score, 2) if score else 0,
        },
        "evaluations": [
            {
                "id": str(e.id),
                "module": e.evaluation_type.value,
                "score": round(e.score, 1) if e.score else 0,
                "feedback": e.feedback or "",
                "created_at": e.created_at.isoformat() if e.created_at else None
            }
            for e in evaluations
        ],
        "progress_history": [] # TODO: Implement history if needed
    }


@router.get("/trainees/{trainee_id}/evaluations", response_model=List[EvaluationResponse])
async def list_instructor_trainee_evaluations(
    trainee_id: int,
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """List evaluations for a specific trainee."""
    trainee_query = select(User).where(User.id == trainee_id, User.role == UserRole.TRAINEE)
    if current_user.role != UserRole.ADMIN:
        trainee_query = trainee_query.where(User.instructor_id == current_user.id)

    trainee_result = await db.execute(trainee_query)
    trainee = trainee_result.scalar_one_or_none()
    if not trainee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trainee not found")

    evaluations_result = await db.execute(
        select(Evaluation).where(Evaluation.user_id == trainee_id).order_by(Evaluation.created_at.desc())
    )
    return evaluations_result.scalars().all()


@router.post("/invite")
async def invite_trainee(
    data: Dict[str, str],
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Invite a new trainee (Instructor only)."""
    email = data.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")
    
    # Check if user already exists
    res = await db.execute(select(User).where(User.email == email))
    user = res.scalar_one_or_none()
    
    if user:
        if user.role != UserRole.TRAINEE:
            raise HTTPException(status_code=400, detail="User is not a trainee")
        
        # Assign to this instructor
        user.instructor_id = current_user.id
        await db.commit()
        return {"status": "success", "message": f"Trainee {email} assigned to you"}
    
@router.get("/export/{trainee_id}")
async def export_trainee_report(
    trainee_id: int,
    format: str = Query("csv", enum=["csv", "pdf"]),
    current_user: User = Depends(get_current_instructor),
    db: AsyncSession = Depends(get_db)
):
    """Export trainee report as CSV or PDF."""
    query = select(User).where(User.id == trainee_id, User.role == UserRole.TRAINEE)
    if current_user.role != UserRole.ADMIN:
        query = query.where(User.instructor_id == current_user.id)
    
    result = await db.execute(query)
    trainee = result.scalar_one_or_none()
    if not trainee:
        raise HTTPException(status_code=404, detail="Trainee not found")
    
    score_res = await db.execute(select(ReadinessScore).where(ReadinessScore.user_id == trainee.id))
    score = score_res.scalar_one_or_none()
    
    evals_res = await db.execute(
        select(Evaluation).where(Evaluation.user_id == trainee.id).order_by(Evaluation.created_at.desc())
    )
    evaluations = evals_res.scalars().all()
    
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Field", "Value"])
        writer.writerow(["Full Name", trainee.full_name])
        writer.writerow(["Email", trainee.email])
        writer.writerow(["Readiness Score", f"{score.overall_score}%" if score else "0%"])
        writer.writerow([])
        writer.writerow(["Module", "Score", "Feedback", "Date"])
        for e in evaluations:
            writer.writerow([
                e.evaluation_type.value,
                f"{e.score}%" if e.score else "N/A",
                e.feedback or "",
                e.created_at.strftime("%Y-%m-%d %H:%M") if e.created_at else "N/A"
            ])
        
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=trainee_{trainee_id}_report.csv"}
        )
    else:
        # Simple text-based PDF fallback (or just a text file for now)
        # In a real app, use reportlab or fpdf2
        report_text = f"Trainee Report: {trainee.full_name}\n"
        report_text += f"Email: {trainee.email}\n"
        report_text += f"Readiness Score: {score.overall_score if score else 0}%\n\n"
        report_text += "Evaluations:\n"
        for e in evaluations:
            report_text += f"- {e.evaluation_type.value}: {e.score}% ({e.created_at})\n"
            report_text += f"  Feedback: {e.feedback}\n"
        
        return StreamingResponse(
            io.BytesIO(report_text.encode()),
            media_type="application/pdf", # Telling the browser it's a PDF even if it's text
            headers={"Content-Disposition": f"attachment; filename=trainee_{trainee_id}_report.pdf"}
        )
