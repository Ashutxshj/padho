from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class MessageCreate(BaseModel):
    message_body: str = Field(min_length=1, max_length=5000)


class MessageOut(BaseModel):
    id: str
    ticket_id: str
    sender_id: str
    sender_role: str
    sender_name: str | None = None
    message_body: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InternalNoteCreate(BaseModel):
    note_text: str = Field(min_length=1, max_length=5000)


class InternalNoteOut(BaseModel):
    id: str
    ticket_id: str
    author_staff_id: str
    staff_name: str | None = None
    note_text: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
