from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class ReadinessScore(Base):
    __tablename__ = "readiness_scores"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    
    # Overall readiness score (0-100)
    overall_score = Column(Float, default=0.0)
    
    # Individual module scores
    cv_score = Column(Float, default=0.0)
    github_score = Column(Float, default=0.0)
    linkedin_score = Column(Float, default=0.0)
    idea_score = Column(Float, default=0.0)
    interview_score = Column(Float, default=0.0)
    english_score = Column(Float, default=0.0)
    
    # Completion status
    cv_completed = Column(Integer, default=0)
    github_completed = Column(Integer, default=0)
    linkedin_completed = Column(Integer, default=0)
    idea_completed = Column(Integer, default=0)
    interview_completed = Column(Integer, default=0)
    english_completed = Column(Integer, default=0)
    
    # AI-generated insights
    strengths = Column(JSON, nullable=True)
    weaknesses = Column(JSON, nullable=True)
    recommendations = Column(JSON, nullable=True)
    career_suggestions = Column(JSON, nullable=True)
    
    # Summary
    summary = Column(Text, nullable=True)
    
    # Timestamps
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="readiness_scores")
