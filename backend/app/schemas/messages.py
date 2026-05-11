from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class ContactResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: UserRole
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class MessageUser(BaseModel):
    id: int
    full_name: str
    role: UserRole
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    recipient_id: int
    content: str


class MessageResponse(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: str
    created_at: datetime
    sender: MessageUser
    recipient: MessageUser

    class Config:
        from_attributes = True
