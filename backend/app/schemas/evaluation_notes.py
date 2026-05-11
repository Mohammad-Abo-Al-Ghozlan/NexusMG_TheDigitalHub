from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.models.evaluation import EvaluationType


class EvaluationNoteBase(BaseModel):
    module: EvaluationType
    note: Optional[str] = None


class EvaluationNoteResponse(EvaluationNoteBase):
    id: int
    trainee_id: int
    instructor_id: Optional[int] = None
    instructor_name: Optional[str] = None
    instructor_role: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class EvaluationNoteUpsert(BaseModel):
    module: EvaluationType
    note: Optional[str] = None


class EvaluationNoteUpsertRequest(BaseModel):
    notes: List[EvaluationNoteUpsert]
