from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: str


class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.TRAINEE
    invite_code: Optional[str] = None


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    email_verified: bool = False
    auth_provider: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None
    created_at: datetime
    instructor_id: Optional[int] = None
    is_onboarded: bool = False
    onboarding_summary: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    credential: str
    invite_code: Optional[str] = None


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AuthResponse(Token):
    user: UserResponse


class RegistrationResponse(BaseModel):
    message: str
    requires_verification: bool = True
    email: EmailStr


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class VerifyEmailResponse(BaseModel):
    message: str


class TokenData(BaseModel):
    user_id: int
    email: str
    role: UserRole


class InstructorInviteCreate(BaseModel):
    email: EmailStr


class InstructorInviteResponse(BaseModel):
    id: int
    email: str
    invite_code: str
    is_used: bool
    created_at: datetime
    expires_at: datetime
    
    class Config:
        from_attributes = True


class OnboardingQuestion(BaseModel):
    id: str
    text: str
    type: str = "text" # e.g. text, select
    options: Optional[List[str]] = None


class OnboardingQuestionsResponse(BaseModel):
    questions: List[OnboardingQuestion]


class OnboardingAnswer(BaseModel):
    question_id: str
    answer: str


class OnboardingSubmission(BaseModel):
    answers: List[OnboardingAnswer]
