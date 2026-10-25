import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Boolean, Date, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="author"
    )  # "author" or "admin"
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    joined_date: Mapped[date] = mapped_column(
        Date,
        default=date.today,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    books: Mapped[list["Book"]] = relationship(
        "Book",
        back_populates="author",
        cascade="all, delete-orphan"
    )
    tickets: Mapped[list["Ticket"]] = relationship(
        "Ticket",
        foreign_keys="[Ticket.author_id]",
        back_populates="author",
        cascade="all, delete-orphan"
    )
    assigned_tickets: Mapped[list["Ticket"]] = relationship(
        "Ticket",
        foreign_keys="[Ticket.assigned_to]",
        back_populates="assignee"
    )
    messages: Mapped[list["TicketMessage"]] = relationship(
        "TicketMessage",
        back_populates="sender",
        cascade="all, delete-orphan"
    )
    internal_notes: Mapped[list["InternalNote"]] = relationship(
        "InternalNote",
        back_populates="staff_author",
        cascade="all, delete-orphan"
    )
