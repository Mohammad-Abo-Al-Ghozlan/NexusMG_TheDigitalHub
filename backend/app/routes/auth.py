"""
Authentication Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
import secrets
from app.database import get_db
from app.models.user import User, UserRole, InstructorInvite
from app.schemas.user import (
    UserCreate, UserResponse, UserLogin, Token,
    InstructorInviteCreate, InstructorInviteResponse, AuthResponse
)
from app.services.auth import (
    hash_password, create_access_token, authenticate_user,
    get_current_user, get_current_admin
)
from app.rate_limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
async def register(request: Request, user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if email exists
    existing_result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = existing_result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Handle instructor registration with invite code
    role = UserRole.TRAINEE
    instructor_id = None
    
    if user_data.invite_code:
        invite_result = await db.execute(
            select(InstructorInvite).where(
                InstructorInvite.invite_code == user_data.invite_code,
                InstructorInvite.email == user_data.email,
                InstructorInvite.is_used == False,
                InstructorInvite.expires_at > datetime.now(timezone.utc)
            )
        )
        invite = invite_result.scalar_one_or_none()

        if not invite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invite code"
            )

        role = UserRole.INSTRUCTOR
        invite.is_used = True
        await db.commit()
    
    # Create user
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=role,
        instructor_id=instructor_id
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = create_access_token(
        data={
            "sub": str(new_user.id),
            "email": new_user.email,
            "role": new_user.role.value,
        }
    )

    return AuthResponse(access_token=access_token, user=new_user)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("5/minute")
async def login(request: Request, credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login and get access token."""
    user = await authenticate_user(db, credentials.email, credentials.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value
        }
    )

    return AuthResponse(access_token=access_token, user=user)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.post("/invite/instructor", response_model=InstructorInviteResponse)
async def create_instructor_invite(
    invite_data: InstructorInviteCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """Create an instructor invite (Admin only)."""
    invite_code = secrets.token_urlsafe(32)
    
    invite = InstructorInvite(
        email=invite_data.email,
        invite_code=invite_code,
        invited_by=current_user.id,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    
    db.add(invite)
    await db.commit()
    await db.refresh(invite)
    
    return invite


@router.get("/invites", response_model=list[InstructorInviteResponse])
async def list_invites(
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all instructor invites (Admin only)."""
    result = await db.execute(select(InstructorInvite))
    return result.scalars().all()
