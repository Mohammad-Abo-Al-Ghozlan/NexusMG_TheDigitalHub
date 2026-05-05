import asyncio
from sqlalchemy import select, update
from app.database import AsyncSessionLocal
from app.models.user import User, UserRole

async def assign_trainees():
    async with AsyncSessionLocal() as session:
        # Get the first instructor
        result = await session.execute(select(User.id).where(User.role == UserRole.INSTRUCTOR))
        instructor_id = result.scalar()
        
        if not instructor_id:
            print("No instructor found in database!")
            return

        print(f"Assigning all trainees to instructor ID: {instructor_id}")
        
        # Assign all trainees who don't have an instructor
        stmt = (
            update(User)
            .where(User.role == UserRole.TRAINEE)
            .where(User.instructor_id.is_(None))
            .values(instructor_id=instructor_id)
        )
        
        await session.execute(stmt)
        await session.commit()
        print("Trainees assigned successfully.")

if __name__ == "__main__":
    asyncio.run(assign_trainees())
