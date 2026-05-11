"""
Authentication Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta, timezone
import secrets
from google.oauth2 import id_token
from google.auth.transport.requests import Request as GoogleRequest
from app.database import get_db
from app.models.user import User, UserRole, InstructorInvite
from app.schemas.user import (
    UserCreate, UserResponse, UserLogin,
    InstructorInviteCreate, InstructorInviteResponse, AuthResponse,
    RegistrationResponse, ResendVerificationRequest, VerifyEmailResponse,
    GoogleAuthRequest
)
from app.services.auth import (
    hash_password, create_access_token, authenticate_user,
    get_current_user, get_current_admin
)
from app.services.email_service import send_email
from app.config import settings
from app.rate_limiter import limiter

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _build_verification_link(token: str) -> str:
    base = settings.APP_BASE_URL.rstrip("/")
    return f"{base}/verify-email?token={token}"


async def _send_verification_email(user: User, token: str) -> None:
        verify_url = _build_verification_link(token)
        subject = "Verify your NexusMG email"
        html = f"""
        <div style=\"font-family:Arial,sans-serif;line-height:1.6;color:#111\">
            <h2>Confirm your email</h2>
            <p>Hi {user.full_name},</p>
            <p>Thanks for creating a NexusMG account. Please verify your email to activate your login.</p>
            <p><a href=\"{verify_url}\" style=\"display:inline-block;padding:10px 18px;background:#6C63FF;color:#fff;border-radius:8px;text-decoration:none\">Verify Email</a></p>
            <p>If the button does not work, copy and paste this link:</p>
            <p>{verify_url}</p>
        </div>
        """
        text = f"Verify your NexusMG email: {verify_url}"
        await send_email(user.email, subject, html, text)


@router.post("/register", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
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
    
    verification_token = secrets.token_urlsafe(32)
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)

    # Create user
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
        role=role,
        instructor_id=instructor_id,
        auth_provider="local",
        email_verified=False,
        email_verification_token=verification_token,
        email_verification_expires=verification_expires,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    try:
        await _send_verification_email(new_user, verification_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to send verification email"
        )

    return RegistrationResponse(
        message="Verification email sent. Please check your inbox.",
        requires_verification=True,
        email=new_user.email,
    )


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

    if user.auth_provider == "google":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use Google sign-in for this account"
        )

    if not user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified"
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


@router.get("/verify-email", response_model=AuthResponse)
@limiter.limit("10/minute")
async def verify_email(request: Request, token: str, db: AsyncSession = Depends(get_db)):
    """Verify email with token and return auth token."""
    result = await db.execute(select(User).where(User.email_verification_token == token))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")

    if user.email_verification_expires and user.email_verification_expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification token expired")

    user.email_verified = True
    user.email_verified_at = datetime.now(timezone.utc)
    user.email_verification_token = None
    user.email_verification_expires = None
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }
    )

    return AuthResponse(access_token=access_token, user=user)


@router.post("/resend-verification", response_model=VerifyEmailResponse)
@limiter.limit("3/minute")
async def resend_verification(
    request: Request,
    payload: ResendVerificationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Resend verification email for unverified accounts."""
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()

    if not user:
        return VerifyEmailResponse(message="If an account exists, a verification email was sent.")

    if user.auth_provider != "local" or user.email_verified:
        return VerifyEmailResponse(message="If an account exists, a verification email was sent.")

    verification_token = secrets.token_urlsafe(32)
    user.email_verification_token = verification_token
    user.email_verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    await db.commit()

    await _send_verification_email(user, verification_token)

    return VerifyEmailResponse(message="If an account exists, a verification email was sent.")


@router.post("/google", response_model=AuthResponse)
@limiter.limit("10/minute")
async def google_auth(request: Request, payload: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate or register user via Google ID token."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Google OAuth not configured")

    try:
        id_info = id_token.verify_oauth2_token(payload.credential, GoogleRequest(), settings.GOOGLE_CLIENT_ID)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token")

    google_sub = id_info.get("sub")
    email = id_info.get("email")
    full_name = id_info.get("name") or "Google User"
    picture = id_info.get("picture")

    if not google_sub or not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google token missing email")

    role = UserRole.TRAINEE
    if payload.invite_code:
        invite_result = await db.execute(
            select(InstructorInvite).where(
                InstructorInvite.invite_code == payload.invite_code,
                InstructorInvite.email == email,
                InstructorInvite.is_used == False,
                InstructorInvite.expires_at > datetime.now(timezone.utc)
            )
        )
        invite = invite_result.scalar_one_or_none()
        if not invite:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired invite code")
        role = UserRole.INSTRUCTOR
        invite.is_used = True
        await db.commit()

    existing_result = await db.execute(select(User).where(User.email == email))
    user = existing_result.scalar_one_or_none()

    if user:
        if user.google_id and user.google_id != google_sub:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Google account mismatch")
        if not user.google_id:
            user.google_id = google_sub
        user.google_email = email
        if picture and not user.avatar_url:
            user.avatar_url = picture
        if not user.email_verified:
            user.email_verified = True
            user.email_verified_at = datetime.now(timezone.utc)
            user.email_verification_token = None
            user.email_verification_expires = None
        await db.commit()
        await db.refresh(user)
    else:
        user = User(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(secrets.token_urlsafe(32)),
            role=role,
            auth_provider="google",
            google_id=google_sub,
            google_email=email,
            avatar_url=picture,
            email_verified=True,
            email_verified_at=datetime.now(timezone.utc),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }
    )
    return AuthResponse(access_token=access_token, user=user)


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
