import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, desc, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.book import Book
from app.models.ticket import Ticket
from app.models.ticket_message import TicketMessage
from app.schemas.ticket import TicketCreate, TicketUpdate, TicketOut, TicketDetailOut
from app.schemas.book import BookOut
from app.schemas.message import MessageOut
from app.schemas.common import PaginatedResponse
from app.services.ai_factory import get_ai_service
from app.services.broadcaster import broadcaster

router = APIRouter()


def generate_reference_no() -> str:
    short_id = uuid.uuid4().hex[:6].upper()
    return f"BL-{short_id}"


def calculate_urgency(priority: str, created_at: datetime) -> int:
    weights = {"Critical": 4000, "High": 3000, "Medium": 2000, "Low": 1000}
    weight = weights.get(priority, 2000)
    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    age_hours = int((now - created_at).total_seconds() // 3600)
    return weight + (age_hours * 2)


def is_ticket_overdue(status_str: str, created_at: datetime) -> bool:
    if status_str in ("Resolved", "Closed"):
        return False
    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return (now - created_at) > timedelta(hours=48)


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: TicketCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Submit a support ticket.
    Validates that the selected book belongs to the authenticated author.
    Persists the ticket, runs AI classification, and publishes an SSE event.
    """
    book_meta = None
    book_title = None

    if payload.book_id:
        result = await db.execute(select(Book).where(Book.id == payload.book_id))
        book = result.scalar_one_or_none()
        if not book:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Book with ID '{payload.book_id}' not found"
            )
        # Server-side ownership verification
        if book.author_id != current_user.id and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You cannot link a book that does not belong to your account"
            )
        book_title = book.title
        book_meta = {
            "book_id": book.id,
            "title": book.title,
            "isbn": book.isbn,
            "status": book.status,
            "royalty_pending": book.royalty_pending,
            "last_royalty_payout_date": str(book.last_royalty_payout_date) if book.last_royalty_payout_date else None,
            "available_on": book.available_on
        }

    # 1. Create and persist ticket first (Graceful Degradation Guarantee)
    ticket = Ticket(
        id=str(uuid.uuid4()),
        reference_no=generate_reference_no(),
        author_id=current_user.id,
        book_id=payload.book_id,
        subject=payload.subject,
        description=payload.description,
        category="General Inquiry",
        priority="Medium",
        status="Open",
        ai_processing_status="PENDING"
    )
    db.add(ticket)
    await db.flush()

    # Initial conversation message
    initial_msg = TicketMessage(
        id=str(uuid.uuid4()),
        ticket_id=ticket.id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        message_body=payload.description
    )
    db.add(initial_msg)
    await db.commit()
    await db.refresh(ticket)

    # 2. Asynchronous AI Enrichment with defensive fallback
    try:
        ai_service = get_ai_service()
        class_res = await ai_service.classify_ticket(
            subject=payload.subject,
            description=payload.description,
            book_meta=book_meta
        )
        prio_res = await ai_service.score_priority(
            subject=payload.subject,
            description=payload.description,
            book_meta=book_meta
        )

        ticket.category = class_res.category
        ticket.priority = prio_res.priority
        ticket.ai_category_suggestion = class_res.category
        ticket.ai_priority_suggestion = prio_res.priority
        ticket.ai_rationale = f"{class_res.rationale} {prio_res.rationale}".strip()
        ticket.ai_processing_status = "COMPLETED"
    except Exception as e:
        # Fallback retains defaults
        ticket.category = "General Inquiry"
        ticket.priority = "Medium"
        ticket.ai_processing_status = "FAILED_FALLBACK"

    await db.commit()
    await db.refresh(ticket)

    # 3. Publish SSE Broadcast
    event_payload = {
        "ticket_id": ticket.id,
        "reference_no": ticket.reference_no,
        "author_id": current_user.id,
        "author_name": current_user.name,
        "subject": ticket.subject,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status
    }
    await broadcaster.publish(
        event_type="ticket_created",
        data=event_payload,
        target_author_id=current_user.id
    )

    ticket_out = TicketOut.model_validate(ticket)
    ticket_out.author_name = current_user.name
    ticket_out.author_email = current_user.email
    ticket_out.book_title = book_title
    ticket_out.is_overdue = False
    return ticket_out


@router.get("", response_model=PaginatedResponse[TicketOut])
async def list_tickets(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(25, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List tickets.
    Authors see only their own tickets.
    Admins see all tickets with filtering, search, and urgency-based sorting.
    """
    query = select(Ticket).options(
        selectinload(Ticket.author),
        selectinload(Ticket.book),
        selectinload(Ticket.assignee)
    )

    if current_user.role == "author":
        query = query.where(Ticket.author_id == current_user.id)
    else:
        # Admin Filters
        if status:
            query = query.where(Ticket.status == status)
        if category:
            query = query.where(Ticket.category == category)
        if priority:
            query = query.where(Ticket.priority == priority)
        if search:
            search_fmt = f"%{search.lower()}%"
            query = query.join(Ticket.author).where(
                or_(
                    func.lower(Ticket.subject).like(search_fmt),
                    func.lower(Ticket.reference_no).like(search_fmt),
                    func.lower(Ticket.description).like(search_fmt),
                    func.lower(User.name).like(search_fmt),
                    func.lower(User.email).like(search_fmt),
                )
            )

    result = await db.execute(query)
    all_tickets = result.scalars().all()

    # Sort tickets deterministically by urgency formula
    if current_user.role == "admin":
        all_tickets.sort(
            key=lambda t: (
                0 if t.status in ("Open", "In Progress") else 1,
                -calculate_urgency(t.priority, t.created_at)
            )
        )
    else:
        all_tickets.sort(key=lambda t: t.created_at, reverse=True)

    total = len(all_tickets)
    offset = (page - 1) * limit
    paginated_tickets = all_tickets[offset : offset + limit]
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    items: List[TicketOut] = []
    for t in paginated_tickets:
        item = TicketOut.model_validate(t)
        item.author_name = t.author.name if t.author else None
        item.author_email = t.author.email if t.author else None
        item.book_title = t.book.title if t.book else None
        item.assignee_name = t.assignee.name if t.assignee else None
        item.is_overdue = is_ticket_overdue(t.status, t.created_at)
        items.append(item)

    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get("/{ticket_id}", response_model=TicketDetailOut)
async def get_ticket_detail(
    ticket_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve full ticket detail with public message history."""
    query = (
        select(Ticket)
        .options(
            selectinload(Ticket.author),
            selectinload(Ticket.book),
            selectinload(Ticket.assignee),
            selectinload(Ticket.messages).selectinload(TicketMessage.sender)
        )
        .where(Ticket.id == ticket_id)
    )
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket with ID '{ticket_id}' not found"
        )

    # Ownership check
    if current_user.role == "author" and ticket.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to view this ticket"
        )

    detail = TicketDetailOut.model_validate(ticket)
    detail.author_name = ticket.author.name if ticket.author else None
    detail.author_email = ticket.author.email if ticket.author else None
    if ticket.author:
        detail.author_phone = ticket.author.phone
        detail.author_city = ticket.author.city
        detail.author_joined_date = str(ticket.author.joined_date) if ticket.author.joined_date else None
    detail.book_title = ticket.book.title if ticket.book else None
    detail.assignee_name = ticket.assignee.name if ticket.assignee else None
    detail.is_overdue = is_ticket_overdue(ticket.status, ticket.created_at)

    if ticket.book:
        detail.book = BookOut.model_validate(ticket.book)

    # Populate sender names on messages
    message_outs: List[MessageOut] = []
    for msg in ticket.messages:
        m = MessageOut.model_validate(msg)
        m.sender_name = msg.sender.name if msg.sender else None
        message_outs.append(m)
    detail.messages = message_outs

    return detail


@router.patch("/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: str,
    payload: TicketUpdate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin-only ticket management:
    Update status, override category/priority, or assign staff.
    """
    result = await db.execute(
        select(Ticket)
        .options(selectinload(Ticket.author), selectinload(Ticket.book), selectinload(Ticket.assignee))
        .where(Ticket.id == ticket_id)
    )
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found"
        )

    # Apply updates
    if payload.status:
        if payload.status not in ("Open", "In Progress", "Resolved", "Closed"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{payload.status}'"
            )
        ticket.status = payload.status

    if payload.category:
        ticket.category = payload.category

    if payload.priority:
        if payload.priority not in ("Critical", "High", "Medium", "Low"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid priority '{payload.priority}'"
            )
        ticket.priority = payload.priority

    if payload.assigned_to:
        ticket.assigned_to = payload.assigned_to

    ticket.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ticket)

    # Publish SSE event
    await broadcaster.publish(
        event_type="ticket_updated",
        data={
            "ticket_id": ticket.id,
            "status": ticket.status,
            "category": ticket.category,
            "priority": ticket.priority,
            "assigned_to": ticket.assigned_to,
            "updated_at": ticket.updated_at.isoformat()
        },
        target_author_id=ticket.author_id
    )

    out = TicketOut.model_validate(ticket)
    out.author_name = ticket.author.name if ticket.author else None
    out.author_email = ticket.author.email if ticket.author else None
    out.book_title = ticket.book.title if ticket.book else None
    out.assignee_name = ticket.assignee.name if ticket.assignee else None
    out.is_overdue = is_ticket_overdue(ticket.status, ticket.created_at)
    return out
