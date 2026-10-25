from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.book import Book
from app.schemas.book import BookOut, RoyaltySummary
from app.schemas.common import PaginatedResponse

router = APIRouter()


@router.get("", response_model=PaginatedResponse[BookOut])
async def list_books(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List books. Authors see only their own books.
    Admins see books across all authors with search and pagination.
    """
    query = select(Book)

    if current_user.role == "author":
        # Strict Author Tenant Isolation
        query = query.where(Book.author_id == current_user.id)
    else:
        # Admin search capability
        if search:
            search_fmt = f"%{search.lower()}%"
            query = query.where(
                func.lower(Book.title).like(search_fmt) |
                func.lower(Book.isbn).like(search_fmt) |
                func.lower(Book.genre).like(search_fmt)
            )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()

    # Pagination
    offset = (page - 1) * limit
    query = query.order_by(Book.title).offset(offset).limit(limit)
    result = await db.execute(query)
    books = result.scalars().all()

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return PaginatedResponse(
        items=[BookOut.model_validate(b) for b in books],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get("/summary/royalties", response_model=RoyaltySummary)
async def get_royalty_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate aggregate royalty stats for the authenticated author:
    Total Earned, Total Paid, and Total Pending.
    """
    query = select(
        func.coalesce(func.sum(Book.total_royalty_earned), 0).label("earned"),
        func.coalesce(func.sum(Book.royalty_paid), 0).label("paid"),
        func.coalesce(func.sum(Book.royalty_pending), 0).label("pending"),
    )

    if current_user.role == "author":
        query = query.where(Book.author_id == current_user.id)

    result = await db.execute(query)
    row = result.one()

    earned = int(row.earned)
    paid = int(row.paid)
    pending = int(row.pending)

    return RoyaltySummary(
        total_earned=earned,
        total_paid=paid,
        total_pending=pending,
        currency="INR",
        eligible_for_payout=pending >= 1000,
        payout_threshold=1000
    )


@router.get("/{book_id}", response_model=BookOut)
async def get_book_by_id(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve detailed book record with ownership verification."""
    result = await db.execute(select(Book).where(Book.id == book_id))
    book = result.scalar_one_or_none()

    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Book with ID '{book_id}' not found"
        )

    # Ownership check
    if current_user.role == "author" and book.author_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this book record"
        )

    return BookOut.model_validate(book)
