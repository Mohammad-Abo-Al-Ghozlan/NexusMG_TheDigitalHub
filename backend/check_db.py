import asyncio
from sqlalchemy import select, func
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole

async def check_db():
    async with AsyncSessionLocal() as session:
        # Total users
        result = await session.execute(select(func.count(User.id)))
        total = result.scalar_one()
        print(f"Total users: {total}")

        # Users by role
        for role in UserRole:
            result = await session.execute(select(func.count(User.id)).where(User.role == role))
            count = result.scalar_one()
            print(f"Role {role.value}: {count}")

        # Check for any trainee with instructor_id
        result = await session.execute(select(func.count(User.id)).where(User.role == UserRole.TRAINEE).where(User.instructor_id.isnot(None)))
        trainees_with_instructor = result.scalar_one()
        print(f"Trainees with instructor: {trainees_with_instructor}")

if __name__ == "__main__":
    asyncio.run(check_db())
