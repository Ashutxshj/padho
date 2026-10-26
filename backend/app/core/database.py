import re
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)
from sqlalchemy.orm import declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL
engine_kwargs = {}

if db_url.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / Supabase configuration
    engine_kwargs["pool_pre_ping"] = True
    # Clean sslmode from query parameters if present, as asyncpg handles SSL via connect_args
    if "sslmode" in db_url:
        db_url = re.sub(r"[?&]sslmode=[^&]+", "", db_url)
        if db_url.endswith("?"):
            db_url = db_url[:-1]

    # Enable SSL for remote cloud databases (e.g., Supabase / AWS / Render)
    if not any(local in db_url for local in ("localhost", "127.0.0.1", "0.0.0.0")):
        engine_kwargs["connect_args"] = {"ssl": True}

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    **engine_kwargs
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency that provides an async database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
