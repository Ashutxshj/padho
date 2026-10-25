from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import require_admin
from app.models.user import User
from app.models.ticket import Ticket
from app.models.book import Book
from app.schemas.ai import ClassificationResult, PriorityResult, DraftResponseRequest, DraftResponseResult
from app.services.ai_factory import get_ai_service

router = APIRouter()


class ClassifyRequest(BaseModel):
    subject: str
    description: str
    book_id: Optional[str] = None


@router.post("/classify", response_model=ClassificationResult)
async def classify_ticket_endpoint(
    payload: ClassifyRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Categorize a support query into 1 of the 6 canonical categories."""
    book_meta = None
    if payload.book_id:
        result = await db.execute(select(Book).where(Book.id == payload.book_id))
        book = result.scalar_one_or_none()
        if book:
            book_meta = {"title": book.title, "genre": book.genre, "status": book.status}

    ai_service = get_ai_service()
    return await ai_service.classify_ticket(
        subject=payload.subject,
        description=payload.description,
        book_meta=book_meta
    )


@router.post("/priority", response_model=PriorityResult)
async def score_priority_endpoint(
    payload: ClassifyRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Score priority: Critical, High, Medium, or Low with business rationale."""
    book_meta = None
    if payload.book_id:
        result = await db.execute(select(Book).where(Book.id == payload.book_id))
        book = result.scalar_one_or_none()
        if book:
            book_meta = {
                "title": book.title,
                "status": book.status,
                "royalty_pending": book.royalty_pending
            }

    ai_service = get_ai_service()
    return await ai_service.score_priority(
        subject=payload.subject,
        description=payload.description,
        book_meta=book_meta
    )


@router.post("/draft-response", response_model=DraftResponseResult)
async def generate_response_draft(
    payload: DraftResponseRequest,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Generate an empathetic, Knowledge-Base-grounded reply draft for a ticket.
    Provides policy citations, facts from author catalog, and respectful tone.
    """
    query = (
        select(Ticket)
        .options(
            selectinload(Ticket.author),
            selectinload(Ticket.book),
            selectinload(Ticket.messages)
        )
        .where(Ticket.id == payload.ticket_id)
    )
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{payload.ticket_id}' not found"
        )

    book_meta = None
    if ticket.book:
        book_meta = {
            "book_id": ticket.book.id,
            "title": ticket.book.title,
            "isbn": ticket.book.isbn,
            "status": ticket.book.status,
            "mrp": ticket.book.mrp,
            "royalty_pending": ticket.book.royalty_pending,
            "total_royalty_earned": ticket.book.total_royalty_earned,
            "royalty_paid": ticket.book.royalty_paid,
            "last_royalty_payout_date": str(ticket.book.last_royalty_payout_date) if ticket.book.last_royalty_payout_date else None,
            "available_on": ticket.book.available_on,
            "print_partner": ticket.book.print_partner
        }

    history = [m.message_body for m in ticket.messages]

    ai_service = get_ai_service()
    return await ai_service.draft_response(
        subject=ticket.subject,
        description=ticket.description,
        book_meta=book_meta,
        author_name=ticket.author.name if ticket.author else "Author",
        conversation_history=history
    )
