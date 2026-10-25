import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from datetime import date

from app.main import app
from app.core.database import Base, get_db
from app.core.security import get_password_hash, create_access_token
from app.models.user import User
from app.models.book import Book
from app.models.ticket import Ticket

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False}
)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


@pytest_asyncio.fixture(scope="function")
async def db_session():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        # Seed test users
        admin = User(
            id="TEST_ADMIN",
            email="admin@bookleaf.com",
            password_hash=get_password_hash("AdminPass123!"),
            name="Test Admin",
            role="admin",
            joined_date=date(2023, 1, 1),
            is_active=True
        )
        author1 = User(
            id="TEST_AUTH_1",
            email="author1@bookleaf.com",
            password_hash=get_password_hash("AuthorPass123!"),
            name="Author One",
            role="author",
            joined_date=date(2023, 1, 1),
            is_active=True
        )
        author2 = User(
            id="TEST_AUTH_2",
            email="author2@bookleaf.com",
            password_hash=get_password_hash("AuthorPass123!"),
            name="Author Two",
            role="author",
            joined_date=date(2023, 1, 1),
            is_active=True
        )
        session.add_all([admin, author1, author2])

        # Seed test books
        book1 = Book(
            id="TEST_BK_1",
            author_id="TEST_AUTH_1",
            title="Author 1 Book",
            isbn="978-93-5000-01-1",
            genre="Fiction",
            status="Published & Live",
            mrp=399,
            total_copies_sold=100,
            total_royalty_earned=3500,
            royalty_paid=2000,
            royalty_pending=1500,
            available_on=["Amazon India"]
        )
        book2 = Book(
            id="TEST_BK_2",
            author_id="TEST_AUTH_2",
            title="Author 2 Book",
            isbn="978-93-5000-02-2",
            genre="Non-Fiction",
            status="Published & Live",
            mrp=450,
            total_copies_sold=50,
            total_royalty_earned=2100,
            royalty_paid=2100,
            royalty_pending=0,
            available_on=["Amazon India"]
        )
        session.add_all([book1, book2])
        await session.commit()

        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture(scope="function")
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


@pytest.fixture
def auth1_token():
    return create_access_token(subject="TEST_AUTH_1", role="author")


@pytest.fixture
def auth2_token():
    return create_access_token(subject="TEST_AUTH_2", role="author")


@pytest.fixture
def admin_token():
    return create_access_token(subject="TEST_ADMIN", role="admin")
