import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class InternalNote(Base):
    __tablename__ = "internal_notes"

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
    author_staff_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    note_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    ticket: Mapped["Ticket"] = relationship("Ticket", back_populates="internal_notes")
    staff_author: Mapped["User"] = relationship("User", back_populates="internal_notes")
