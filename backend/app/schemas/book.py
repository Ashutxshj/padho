from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class BookBase(BaseModel):
    title: str
    isbn: Optional[str] = None
    genre: str
    publication_date: Optional[date] = None
    status: str
    mrp: Optional[int] = None
    author_royalty_per_copy: Optional[int] = None
    print_partner: Optional[str] = None
    available_on: List[str] = []


class BookOut(BookBase):
    id: str
    author_id: str
    total_copies_sold: int
    total_royalty_earned: int
    royalty_paid: int
    royalty_pending: int
    last_royalty_payout_date: Optional[date] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoyaltySummary(BaseModel):
    total_earned: int
    total_paid: int
    total_pending: int
    currency: str = "INR"
    eligible_for_payout: bool
    payout_threshold: int = 1000
