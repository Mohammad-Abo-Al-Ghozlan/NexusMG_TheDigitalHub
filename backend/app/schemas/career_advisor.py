from pydantic import BaseModel
from typing import Optional


class CareerAdviceRequest(BaseModel):
    target_role: Optional[str] = None
    message: Optional[str] = None


class CareerAdviceResponse(BaseModel):
    content: str
