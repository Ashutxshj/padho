from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.book import BookOut
from app.schemas.message import MessageOut


class TicketCreate(BaseModel):
    book_id: Optional[str] = None
    subject: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=10, max_length=10000)


class TicketUpdate(BaseModel):
    status: Optional[str] = None  # Open, In Progress, Resolved, Closed
    category: Optional[str] = None
    priority: Optional[str] = None  # Critical, High, Medium, Low
    assigned_to: Optional[str] = None


class TicketOut(BaseModel):
    id: str
    reference_no: str
    author_id: str
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    book_id: Optional[str] = None
    book_title: Optional[str] = None
    subject: str
    description: str
    category: str
    priority: str
    status: str
    ai_category_suggestion: Optional[str] = None
    ai_priority_suggestion: Optional[str] = None
    ai_rationale: Optional[str] = None
    ai_processing_status: str
    assigned_to: Optional[str] = None
    assignee_name: Optional[str] = None
    is_overdue: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TicketDetailOut(TicketOut):
    author_phone: Optional[str] = None
    author_city: Optional[str] = None
    author_joined_date: Optional[str] = None
    book: Optional[BookOut] = None
    messages: List[MessageOut] = []

    model_config = ConfigDict(from_attributes=True)
