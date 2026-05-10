import asyncio
from sqlalchemy import text
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

async def restore_scores():
    async with engine.begin() as conn:
        try:
            # The correct values based on the terminal output
            query = """
            UPDATE readiness_scores 
            SET 
                overall_score = 76.1417,
                cv_score = 88.0,
                github_score = 67.0,
                linkedin_score = 68.0,
                idea_score = 81.25,
                interview_score = 89.1,
                english_score = 63.5,
                cv_completed = 1,
                github_completed = 1,
                linkedin_completed = 1,
                idea_completed = 1,
                interview_completed = 1,
                english_completed = 1
            WHERE user_id = 1
            """
            await conn.execute(text(query))
            print("Successfully restored scores for user_id = 1")
        except Exception as e:
            print(f"Error restoring scores: {e}")

if __name__ == "__main__":
    asyncio.run(restore_scores())
