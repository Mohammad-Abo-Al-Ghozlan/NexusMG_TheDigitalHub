"""Validate readiness recalculation determinism."""
import asyncio
import math
import os
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.readiness import ReadinessScore
from app.services.readiness import calculate_overall_readiness


def _is_close(a: float, b: float) -> bool:
    return math.isclose(a, b, rel_tol=1e-6, abs_tol=1e-6)


async def main() -> None:
    user_id = int(os.getenv("USER_ID", "0"))
    if user_id <= 0:
        raise SystemExit("Set USER_ID to a valid user id")

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(ReadinessScore).where(ReadinessScore.user_id == user_id))
        readiness = result.scalar_one_or_none()
        if not readiness:
            readiness = ReadinessScore(user_id=user_id)
            session.add(readiness)
            await session.commit()
            await session.refresh(readiness)

        original = {
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
            "overall_score": readiness.overall_score,
        }

        readiness.cv_score = 80.0
        readiness.github_score = 0.0
        readiness.linkedin_score = 0.0
        readiness.idea_score = 0.0
        readiness.interview_score = 0.0
        readiness.english_score = 0.0
        readiness.cv_completed = True
        readiness.github_completed = False
        readiness.linkedin_completed = False
        readiness.idea_completed = False
        readiness.interview_completed = False
        readiness.english_completed = False
        readiness.overall_score = calculate_overall_readiness(readiness)
        await session.commit()
        await session.refresh(readiness)

        expected_cv_only = 80.0
        if not _is_close(readiness.overall_score, expected_cv_only):
            raise SystemExit(f"Mismatch after CV update: expected {expected_cv_only}, got {readiness.overall_score}")

        readiness.github_score = 60.0
        readiness.github_completed = True
        readiness.overall_score = calculate_overall_readiness(readiness)
        await session.commit()
        await session.refresh(readiness)

        expected_cv_github = (80.0 + 60.0) / 2.0
        if not _is_close(readiness.overall_score, expected_cv_github):
            raise SystemExit(
                f"Mismatch after GitHub update: expected {expected_cv_github}, got {readiness.overall_score}"
            )

        first = calculate_overall_readiness(readiness)
        second = calculate_overall_readiness(readiness)
        if not _is_close(first, second):
            raise SystemExit("Non-deterministic recompute detected")

        readiness.cv_score = original["cv_score"]
        readiness.github_score = original["github_score"]
        readiness.linkedin_score = original["linkedin_score"]
        readiness.idea_score = original["idea_score"]
        readiness.interview_score = original["interview_score"]
        readiness.english_score = original["english_score"]
        readiness.cv_completed = original["cv_completed"]
        readiness.github_completed = original["github_completed"]
        readiness.linkedin_completed = original["linkedin_completed"]
        readiness.idea_completed = original["idea_completed"]
        readiness.interview_completed = original["interview_completed"]
        readiness.english_completed = original["english_completed"]
        readiness.overall_score = original["overall_score"]
        await session.commit()

    print("Readiness validation passed")


if __name__ == "__main__":
    asyncio.run(main())
