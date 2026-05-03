from sqlalchemy import Column, Integer, String, Enum, DateTime, Float, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class EvaluationType(str, enum.Enum):
    CV = "cv"
    GITHUB = "github"
    LINKEDIN = "linkedin"
    IDEA = "idea"
    INTERVIEW = "interview"
    ENGLISH = "english"


class EvaluationStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"


class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    evaluation_type = Column(Enum(EvaluationType), nullable=False)
    status = Column(Enum(EvaluationStatus), default=EvaluationStatus.PENDING)
    
    # Score (0-100)
    score = Column(Float, nullable=True)
    
    # Input data (JSON)
    input_data = Column(JSON, nullable=True)
    
    # AI Analysis results (JSON)
    analysis = Column(JSON, nullable=True)
    
    # Feedback and recommendations
    feedback = Column(Text, nullable=True)
    recommendations = Column(JSON, nullable=True)
    
    # For file uploads (CV)
    file_path = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationship
    user = relationship("User", back_populates="evaluations")


class CVEvaluation(Base):
    __tablename__ = "cv_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"), nullable=False)
    
    # Parsed CV data
    extracted_text = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True)
    experience = Column(JSON, nullable=True)
    education = Column(JSON, nullable=True)
    projects = Column(JSON, nullable=True)
    
    # Section scores
    format_score = Column(Float, nullable=True)
    content_score = Column(Float, nullable=True)
    skills_score = Column(Float, nullable=True)
    experience_score = Column(Float, nullable=True)


class GitHubEvaluation(Base):
    __tablename__ = "github_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"), nullable=False)
    
    # GitHub data
    username = Column(String(100), nullable=False)
    profile_data = Column(JSON, nullable=True)
    repositories = Column(JSON, nullable=True)
    
    # Scores
    activity_score = Column(Float, nullable=True)
    code_quality_score = Column(Float, nullable=True)
    diversity_score = Column(Float, nullable=True)
    documentation_score = Column(Float, nullable=True)


class LinkedInEvaluation(Base):
    __tablename__ = "linkedin_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"), nullable=False)
    
    # LinkedIn data
    profile_url = Column(String(500), nullable=True)
    profile_data = Column(JSON, nullable=True)
    is_manual_entry = Column(Integer, default=0)
    
    # Scores
    completeness_score = Column(Float, nullable=True)
    network_score = Column(Float, nullable=True)
    engagement_score = Column(Float, nullable=True)


class IdeaEvaluation(Base):
    __tablename__ = "idea_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"), nullable=False)
    
    # Idea details
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    problem_statement = Column(Text, nullable=True)
    target_audience = Column(Text, nullable=True)
    tech_stack = Column(JSON, nullable=True)
    
    # Scores
    innovation_score = Column(Float, nullable=True)
    feasibility_score = Column(Float, nullable=True)
    market_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)


class InterviewEvaluation(Base):
    __tablename__ = "interview_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"), nullable=False)
    
    # Interview session data
    questions = Column(JSON, nullable=True)
    answers = Column(JSON, nullable=True)
    topic = Column(String(100), nullable=True)
    difficulty = Column(String(50), nullable=True)
    
    # Scores
    technical_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    problem_solving_score = Column(Float, nullable=True)


class EnglishEvaluation(Base):
    __tablename__ = "english_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id"), nullable=False)
    
    # Assessment data
    assessment_type = Column(String(50), nullable=True)  # grammar, vocabulary, writing, speaking
    questions = Column(JSON, nullable=True)
    answers = Column(JSON, nullable=True)
    
    # Scores
    grammar_score = Column(Float, nullable=True)
    vocabulary_score = Column(Float, nullable=True)
    fluency_score = Column(Float, nullable=True)
    comprehension_score = Column(Float, nullable=True)
