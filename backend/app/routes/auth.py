"""
Authentication Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import secrets
from app.database import get_db
from app.models.user import User, UserRole, InstructorInvite
from app.schemas.user import (
    UserCreate, UserResponse, UserLogin, Token,
    InstructorInviteCreate, InstructorInviteResponse
)
from app.services.auth import (
    hash_password, create_access_token, authenticate_user,
    get_current_user, get_current_admin
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if email exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Handle instructor registration with invite code
    role = UserRole.TRAINEE
    instructor_id = None
    
    if user_data.invite_code:
        invite = db.query(InstructorInvite).filter(
            InstructorInvite.invite_code == user_data.invite_code,
            InstructorInvite.is_used == False,
            InstructorInvite.expires_at > datetime.utcnow()
        ).first()
        
        if invite:
            role = UserRole.INSTRUCTOR
            invite.is_used = True
            db.commit()
    
    # Create user
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=role,
        instructor_id=instructor_id
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login and get access token."""
    user = authenticate_user(db, credentials.email, credentials.password)
    
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
    
    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information."""
    return current_user


@router.post("/invite/instructor", response_model=InstructorInviteResponse)
async def create_instructor_invite(
    invite_data: InstructorInviteCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Create an instructor invite (Admin only)."""
    invite_code = secrets.token_urlsafe(32)
    
    invite = InstructorInvite(
        email=invite_data.email,
        invite_code=invite_code,
        invited_by=current_user.id,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    
    db.add(invite)
    db.commit()
    db.refresh(invite)
    
    return invite


@router.get("/invites", response_model=list[InstructorInviteResponse])
async def list_invites(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all instructor invites (Admin only)."""
    invites = db.query(InstructorInvite).all()
    return invites
