import asyncio
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole

async def get_instructor():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User.email).where(User.role == UserRole.INSTRUCTOR))
        email = result.scalar()
        print(f"Instructor Email: {email}")

if __name__ == "__main__":
    asyncio.run(get_instructor())
