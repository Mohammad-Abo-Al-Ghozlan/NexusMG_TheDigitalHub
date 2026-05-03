from sqlalchemy import Column, Integer, String, Enum, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    TRAINEE = "trainee"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.TRAINEE, nullable=False)
    is_active = Column(Boolean, default=True)
    
    # Profile fields
    phone = Column(String(20), nullable=True)
    university = Column(String(255), nullable=True)
    major = Column(String(255), nullable=True)
    graduation_year = Column(Integer, nullable=True)
    
    # External profiles
    github_username = Column(String(100), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    evaluations = relationship("Evaluation", back_populates="user")
    readiness_scores = relationship("ReadinessScore", back_populates="user")
    
    # Instructor relationship
    instructor_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    instructor = relationship("User", remote_side=[id], backref="trainees")


class InstructorInvite(Base):
    __tablename__ = "instructor_invites"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=False)
    invite_code = Column(String(100), unique=True, nullable=False)
    invited_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
