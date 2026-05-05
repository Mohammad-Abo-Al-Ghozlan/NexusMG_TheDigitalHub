import asyncio
from sqlalchemy import update
from app.database import AsyncSessionLocal
from app.models.user import User
from app.services.auth import hash_password

async def reset():
    async with AsyncSessionLocal() as session:
        h = hash_password('password123')
        await session.execute(
            update(User)
            .where(User.email == 'moghozdev@gmail.com')
            .values(hashed_password=h)
        )
        await session.commit()
        print("Password reset to: password123")

if __name__ == "__main__":
    asyncio.run(reset())
