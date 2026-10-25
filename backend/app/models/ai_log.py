import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Integer, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class AILog(Base):
    __tablename__ = "ai_logs"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    ticket_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("tickets.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    operation: Mapped[str] = mapped_column(
        String(50),
        nullable=False
    )  # "classification", "priority", "draft_response"
    model_name: Mapped[str] = mapped_column(String(100), nullable=False)
    prompt_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    completion_tokens: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    raw_input: Mapped[str | None] = mapped_column(Text, nullable=True)
    raw_output: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
