from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Any, Dict
from datetime import datetime
from app.models.evaluation import EvaluationType, EvaluationStatus


class EvaluationBase(BaseModel):
    evaluation_type: EvaluationType


class EvaluationResponse(EvaluationBase):
    id: int
    user_id: int
    status: EvaluationStatus
    score: Optional[float] = None
    analysis: Optional[Dict[str, Any]] = None
    feedback: Optional[str] = None
    recommendations: Optional[List[str]] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


# CV Evaluation
class CVSubmit(BaseModel):
    pass  # File upload handled separately


class CVAnalysisResponse(BaseModel):
    format_score: float
    content_score: float
    skills_score: float
    experience_score: float
    overall_score: float
    skills: List[str]
    experience: List[Dict[str, Any]]
    education: List[Dict[str, Any]]
    feedback: str
    recommendations: List[str]


# GitHub Evaluation
class GitHubSubmit(BaseModel):
    username: str


class GitHubAnalysisResponse(BaseModel):
    activity_score: float
    code_quality_score: float
    diversity_score: float
    documentation_score: float
    overall_score: float
    profile: Dict[str, Any]
    top_repositories: List[Dict[str, Any]]
    languages: Dict[str, int]
    feedback: str
    recommendations: List[str]


# LinkedIn Evaluation
class LinkedInSubmit(BaseModel):
    profile_url: Optional[str] = None
    manual_data: Optional[Dict[str, Any]] = None


class LinkedInAnalysisResponse(BaseModel):
    completeness_score: float
    network_score: float
    engagement_score: float
    overall_score: float
    profile_data: Dict[str, Any]
    feedback: str
    recommendations: List[str]


# Idea Evaluation
class IdeaSubmit(BaseModel):
    title: str
    description: str
    problem_statement: Optional[str] = None
    target_audience: Optional[str] = None
    tech_stack: Optional[List[str]] = None


class IdeaAnalysisResponse(BaseModel):
    innovation_score: float
    feasibility_score: float
    market_score: float
    technical_score: float
    overall_score: float
    swot_analysis: Dict[str, List[str]]
    feedback: str
    recommendations: List[str]


# Interview Evaluation
class InterviewStart(BaseModel):
    topic: str
    difficulty: str = "intermediate"  # beginner, intermediate, advanced


class InterviewAnswer(BaseModel):
    question_id: int
    answer: str


class InterviewQuestion(BaseModel):
    id: int
    question: str
    topic: str
    difficulty: str


class InterviewAnalysisResponse(BaseModel):
    technical_score: float
    communication_score: float
    problem_solving_score: float
    overall_score: float
    questions_analysis: List[Dict[str, Any]]
    feedback: str
    recommendations: List[str]


# English Assessment
class EnglishStart(BaseModel):
    assessment_type: str = "comprehensive"  # grammar, vocabulary, writing, comprehensive


class EnglishAnswer(BaseModel):
    question_id: int
    answer: str


class EnglishAnalysisResponse(BaseModel):
    grammar_score: float
    vocabulary_score: float
    fluency_score: float
    comprehension_score: float
    overall_score: float
    cefr_level: str  # A1, A2, B1, B2, C1, C2
    feedback: str
    recommendations: List[str]


# Readiness Score
class ReadinessScoreResponse(BaseModel):
    overall_score: float
    cv_score: float
    github_score: float
    linkedin_score: float
    idea_score: float
    interview_score: float
    english_score: float
    cv_completed: bool
    github_completed: bool
    linkedin_completed: bool
    idea_completed: bool
    interview_completed: bool
    english_completed: bool
    strengths: Optional[List[str]] = None
    weaknesses: Optional[List[str]] = None
    recommendations: Optional[List[str]] = None
    career_suggestions: Optional[List[str]] = None
    summary: Optional[str] = None
    
    class Config:
        from_attributes = True
