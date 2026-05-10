import asyncio
from sqlalchemy import text
import sys
import os

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine

async def run_migration():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN is_onboarded TINYINT(1) DEFAULT 0"))
            print("Successfully added is_onboarded")
        except Exception as e:
            print(f"Error adding is_onboarded: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN onboarding_summary TEXT NULL"))
            print("Successfully added onboarding_summary")
        except Exception as e:
            print(f"Error adding onboarding_summary: {e}")

if __name__ == "__main__":
    asyncio.run(run_migration())
