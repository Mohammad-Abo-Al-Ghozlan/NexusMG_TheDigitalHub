from pydantic import BaseModel, EmailStr
from typing import Optional
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
    full_name: Optional[str] = None
    phone: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    phone: Optional[str] = None
    university: Optional[str] = None
    major: Optional[str] = None
    graduation_year: Optional[int] = None
    github_username: Optional[str] = None
    linkedin_url: Optional[str] = None
    created_at: datetime
    instructor_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


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
