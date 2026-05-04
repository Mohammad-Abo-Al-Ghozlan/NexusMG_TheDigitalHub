from app.models.readiness import ReadinessScore
from app.models.user import User
from app.services.ai.groq_service import groq_service


def calculate_overall_readiness(readiness: ReadinessScore) -> float:
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


async def generate_readiness_summary(readiness: ReadinessScore, user: User) -> dict:
    scores = {
        "overall_score": readiness.overall_score,
        "cv_score": readiness.cv_score,
        "github_score": readiness.github_score,
        "linkedin_score": readiness.linkedin_score,
        "idea_score": readiness.idea_score,
        "interview_score": readiness.interview_score,
        "english_score": readiness.english_score,
        "cv_completed": readiness.cv_completed,
        "github_completed": readiness.github_completed,
        "linkedin_completed": readiness.linkedin_completed,
        "idea_completed": readiness.idea_completed,
        "interview_completed": readiness.interview_completed,
        "english_completed": readiness.english_completed,
    }

    user_data = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "github_username": user.github_username,
        "linkedin_url": user.linkedin_url,
        "university": user.university,
        "major": user.major,
        "graduation_year": user.graduation_year,
    }

    return await groq_service.generate_readiness_summary(scores, user_data)
