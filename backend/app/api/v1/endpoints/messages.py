import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user, require_admin
from app.models.user import User
from app.models.ticket import Ticket
from app.models.ticket_message import TicketMessage
from app.models.internal_note import InternalNote
from app.schemas.message import MessageCreate, MessageOut, InternalNoteCreate, InternalNoteOut
from app.services.broadcaster import broadcaster

router = APIRouter()


@router.post("/{ticket_id}/messages", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def create_ticket_message(
    ticket_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Post a public response to a ticket.
    If sent by an admin on an Open ticket, auto-transitions status to 'In Progress'.
    Emits a real-time SSE event to the author.
    """
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found"
        )

    # Ownership check: Author must own ticket, or user is admin
    if current_user.role == "author" and ticket.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to reply to this ticket"
        )

    # Create message
    msg = TicketMessage(
        id=str(uuid.uuid4()),
        ticket_id=ticket.id,
        sender_id=current_user.id,
        sender_role=current_user.role,
        message_body=payload.message_body
    )
    db.add(msg)

    # Auto-transition status if admin replies to Open ticket
    if current_user.role == "admin" and ticket.status == "Open":
        ticket.status = "In Progress"

    ticket.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(msg)

    # Publish real-time SSE event
    event_data = {
        "message_id": msg.id,
        "ticket_id": ticket.id,
        "sender_id": current_user.id,
        "sender_name": current_user.name,
        "sender_role": current_user.role,
        "message_body": msg.message_body,
        "created_at": msg.created_at.isoformat(),
        "ticket_status": ticket.status
    }
    await broadcaster.publish(
        event_type="new_message",
        data=event_data,
        target_author_id=ticket.author_id
    )

    out = MessageOut.model_validate(msg)
    out.sender_name = current_user.name
    return out


@router.get("/{ticket_id}/internal-notes", response_model=List[InternalNoteOut])
async def list_internal_notes(
    ticket_id: str,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin-only: Retrieve private internal staff commentary for a ticket.
    Strictly forbidden to author accounts.
    """
    query = (
        select(InternalNote)
        .options(selectinload(InternalNote.staff_author))
        .where(InternalNote.ticket_id == ticket_id)
        .order_by(InternalNote.created_at)
    )
    result = await db.execute(query)
    notes = result.scalars().all()

    outs: List[InternalNoteOut] = []
    for n in notes:
        item = InternalNoteOut.model_validate(n)
        item.staff_name = n.staff_author.name if n.staff_author else None
        outs.append(item)
    return outs


@router.post("/{ticket_id}/internal-notes", response_model=InternalNoteOut, status_code=status.HTTP_201_CREATED)
async def create_internal_note(
    ticket_id: str,
    payload: InternalNoteCreate,
    admin_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Admin-only: Add a private staff note to a ticket.
    Authors will never see this note.
    """
    result = await db.execute(select(Ticket).where(Ticket.id == ticket_id))
    ticket = result.scalar_one_or_none()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ticket '{ticket_id}' not found"
        )

    note = InternalNote(
        id=str(uuid.uuid4()),
        ticket_id=ticket.id,
        author_staff_id=admin_user.id,
        note_text=payload.note_text
    )
    db.add(note)
    ticket.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(note)

    out = InternalNoteOut.model_validate(note)
    out.staff_name = admin_user.name
    return out
