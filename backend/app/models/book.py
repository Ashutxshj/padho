import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Integer, Date, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Book(Base):
    __tablename__ = "books"

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )
    author_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False, index=True)
    isbn: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    genre: Mapped[str] = mapped_column(String(100), nullable=False)
    publication_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(100), nullable=False)
    mrp: Mapped[int | None] = mapped_column(Integer, nullable=True)
    author_royalty_per_copy: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_copies_sold: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_royalty_earned: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    royalty_paid: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    royalty_pending: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_royalty_payout_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    print_partner: Mapped[str | None] = mapped_column(String(100), nullable=True)
    available_on: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    author: Mapped["User"] = relationship("User", back_populates="books")
    tickets: Mapped[list["Ticket"]] = relationship("Ticket", back_populates="book")
