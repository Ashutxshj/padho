from typing import List, Optional
from pydantic import BaseModel, Field


class ClassificationResult(BaseModel):
    category: str = Field(
        description="One of the 6 canonical BookLeaf support categories"
    )
    confidence: float = Field(ge=0.0, le=1.0, default=1.0)
    rationale: str = Field(description="1-2 sentence explanation of classification")


class PriorityResult(BaseModel):
    priority: str = Field(
        description="One of: Critical, High, Medium, Low"
    )
    urgency_score: int = Field(ge=1, le=4, default=2)
    rationale: str = Field(description="1-2 sentence business and SLA rationale")


class DraftResponseRequest(BaseModel):
    ticket_id: str


class DraftResponseResult(BaseModel):
    suggested_draft: str
    grounded_policies_used: List[str] = []
    confidence_score: float = 1.0
    model_used: str = "mock"
