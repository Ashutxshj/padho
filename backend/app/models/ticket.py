import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Ticket(Base):
    __tablename__ = "tickets"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    reference_no: Mapped[str] = mapped_column(
        String(20),
        unique=True,
        index=True,
        nullable=False
    )
    author_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    book_id: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("books.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="General Inquiry",
        index=True
    )
    priority: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="Medium",
        index=True
    )
    status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="Open",
        index=True
    )  # Open, In Progress, Resolved, Closed
    ai_category_suggestion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ai_priority_suggestion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    ai_rationale: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_processing_status: Mapped[str] = mapped_column(
        String(30),
        nullable=False,
        default="PENDING"
    )  # PENDING, COMPLETED, FAILED_FALLBACK
    assigned_to: Mapped[str | None] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True
    )

    # Relationships
    author: Mapped["User"] = relationship(
        "User",
        foreign_keys=[author_id],
        back_populates="tickets"
    )
    book: Mapped["Book | None"] = relationship("Book", back_populates="tickets")
    assignee: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[assigned_to],
        back_populates="assigned_tickets"
    )
    messages: Mapped[list["TicketMessage"]] = relationship(
        "TicketMessage",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="TicketMessage.created_at"
    )
    internal_notes: Mapped[list["InternalNote"]] = relationship(
        "InternalNote",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="InternalNote.created_at"
    )
