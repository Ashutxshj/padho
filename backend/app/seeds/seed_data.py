import asyncio
import json
import os
from datetime import datetime, date
from pathlib import Path
from sqlalchemy import select
from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.user import User
from app.models.book import Book
from app.models.ticket import Ticket
from app.models.ticket_message import TicketMessage
from app.models.internal_note import InternalNote


def parse_date(date_str: str | None) -> date | None:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").date()
    except Exception:
        return None


async def seed_database():
    """Initializes database schema and populates with sample authors, books, and tickets."""
    print("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Locate bookleaf_sample_data.json
    possible_paths = [
        Path(__file__).resolve().parent.parent.parent.parent / "bookleaf_sample_data.json",
        Path(__file__).resolve().parent.parent.parent / "bookleaf_sample_data.json",
        Path("bookleaf_sample_data.json"),
        Path("C:/Users/Ashut/Downloads/bookleaf_sample_data.json"),
    ]
    
    sample_file = None
    for p in possible_paths:
        if p.exists():
            sample_file = p
            break
            
    if not sample_file:
        raise FileNotFoundError("Could not find bookleaf_sample_data.json in search paths")
        
    print(f"Loading sample data from {sample_file}...")
    with open(sample_file, "r", encoding="utf-8") as f:
        data = json.load(f)
        
    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(User).limit(1))
        if result.scalar_one_or_none():
            print("Database already contains data. Skipping re-seed.")
            return

        # 1. Create Admin Account
        admin_user = User(
            id="ADMIN001",
            email="admin@bookleafpub.com",
            password_hash=get_password_hash("Admin123!"),
            name="Saloni Mourya (Ops Admin)",
            role="admin",
            phone="+91-11-4567-8900",
            city="Delhi",
            joined_date=date(2022, 1, 1),
            is_active=True
        )
        session.add(admin_user)
        print("Created operations admin: admin@bookleafpub.com / Admin123!")

        # 2. Ingest Authors and Books
        author_count = 0
        book_count = 0
        for author_data in data.get("authors", []):
            author_id = author_data["author_id"]
            author = User(
                id=author_id,
                email=author_data["email"],
                password_hash=get_password_hash("Author123!"),
                name=author_data["name"],
                role="author",
                phone=author_data.get("phone"),
                city=author_data.get("city"),
                joined_date=parse_date(author_data.get("joined_date")) or date.today(),
                is_active=True
            )
            session.add(author)
            author_count += 1

            for b in author_data.get("books", []):
                book = Book(
                    id=b["book_id"],
                    author_id=author_id,
                    title=b["title"],
                    isbn=b.get("isbn"),
                    genre=b.get("genre", "General"),
                    publication_date=parse_date(b.get("publication_date")),
                    status=b.get("status", "Published & Live"),
                    mrp=b.get("mrp"),
                    author_royalty_per_copy=b.get("author_royalty_per_copy"),
                    total_copies_sold=b.get("total_copies_sold", 0),
                    total_royalty_earned=b.get("total_royalty_earned", 0),
                    royalty_paid=b.get("royalty_paid", 0),
                    royalty_pending=b.get("royalty_pending", 0),
                    last_royalty_payout_date=parse_date(b.get("last_royalty_payout_date")),
                    print_partner=b.get("print_partner"),
                    available_on=b.get("available_on", [])
                )
                session.add(book)
                book_count += 1

        await session.flush()
        print(f"Seeded {author_count} authors and {book_count} books.")

        # 3. Create Representative Demonstration Tickets
        # Ticket 1: Priya Sharma (AUTH001) - Royalty inquiry
        t1 = Ticket(
            id="TCK001-PRIYA-ROYALTY",
            reference_no="BL-2026-001",
            author_id="AUTH001",
            book_id="BK001",
            subject="Pending Q3 Royalty Payout of ₹3,570",
            description="I published 'Whispers of the Ganges' and have a pending royalty balance of ₹3,570. The last payout was recorded on Oct 15, 2025. Could you please clarify when this quarter's balance will be transferred to my bank account?",
            category="Royalty & Payments",
            priority="High",
            status="In Progress",
            ai_category_suggestion="Royalty & Payments",
            ai_priority_suggestion="High",
            ai_rationale="Inquiry regarding overdue royalty balance exceeding the ₹1,000 threshold with concrete amount cited.",
            ai_processing_status="COMPLETED",
            assigned_to="ADMIN001"
        )
        session.add(t1)
        await session.flush()

        msg1 = TicketMessage(
            ticket_id=t1.id,
            sender_id="AUTH001",
            sender_role="author",
            message_body="I published 'Whispers of the Ganges' and have a pending royalty balance of ₹3,570. The last payout was recorded on Oct 15, 2025. Could you please clarify when this quarter's balance will be transferred to my bank account?"
        )
        msg2 = TicketMessage(
            ticket_id=t1.id,
            sender_id="ADMIN001",
            sender_role="admin",
            message_body="Hello Priya, thank you for checking in. We have reviewed your account: your pending balance of ₹3,570 is above our ₹1,000 threshold and is scheduled for the upcoming quarterly payout cycle. Our finance desk is verifying your linked bank details, and you will receive a confirmation within 48 hours."
        )
        note1 = InternalNote(
            ticket_id=t1.id,
            author_staff_id="ADMIN001",
            note_text="Finance desk verified IFSC code. Batch transfer queued for Wednesday release."
        )
        session.add_all([msg1, msg2, note1])

        # Ticket 2: Sneha Kulkarni (AUTH007) - Book in production status
        t2 = Ticket(
            id="TCK002-SNEHA-PRODUCTION",
            reference_no="BL-2026-002",
            author_id="AUTH007",
            book_id="BK013",
            subject="Cover Design Approval Timeline for Midnight in Mysore",
            description="My book 'Midnight in Mysore' has been in the Cover Design stage for 2 weeks. Can someone share the updated mockups or let me know the expected completion date?",
            category="Book Status & Production Updates",
            priority="Medium",
            status="Open",
            ai_category_suggestion="Book Status & Production Updates",
            ai_priority_suggestion="Medium",
            ai_rationale="Production stage progress query without immediate publication launch deadline.",
            ai_processing_status="COMPLETED"
        )
        session.add(t2)
        await session.flush()

        msg3 = TicketMessage(
            ticket_id=t2.id,
            sender_id="AUTH007",
            sender_role="author",
            message_body="My book 'Midnight in Mysore' has been in the Cover Design stage for 2 weeks. Can someone share the updated mockups or let me know the expected completion date?"
        )
        session.add(msg3)

        # Ticket 3: Kavita Deshmukh (AUTH009) - Sub-threshold balance query
        t3 = Ticket(
            id="TCK003-KAVITA-THRESHOLD",
            reference_no="BL-2026-003",
            author_id="AUTH009",
            book_id="BK016",
            subject="Royalty Payout Status for The Nagpur Notebooks",
            description="My book sold 34 copies and earned ₹850, but I have not received any payout yet. Why is that?",
            category="Royalty & Payments",
            priority="Low",
            status="Open",
            ai_category_suggestion="Royalty & Payments",
            ai_priority_suggestion="Low",
            ai_rationale="Earnings balance (₹850) is below the mandatory ₹1,000 minimum payout threshold, standard policy inquiry.",
            ai_processing_status="COMPLETED"
        )
        session.add(t3)
        await session.flush()

        msg4 = TicketMessage(
            ticket_id=t3.id,
            sender_id="AUTH009",
            sender_role="author",
            message_body="My book sold 34 copies and earned ₹850, but I have not received any payout yet. Why is that?"
        )
        session.add(msg4)

        await session.commit()
        print("Database seeding completed successfully with demo accounts and tickets!")


if __name__ == "__main__":
    asyncio.run(seed_database())
