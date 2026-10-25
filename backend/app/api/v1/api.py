from fastapi import APIRouter
from app.api.v1.endpoints import auth, books, tickets, messages, ai, stream

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(books.router, prefix="/books", tags=["Books & Royalties"])
api_router.include_router(tickets.router, prefix="/tickets", tags=["Tickets & Queue"])
api_router.include_router(messages.router, prefix="/tickets", tags=["Messages & Notes"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Operations"])
api_router.include_router(stream.router, prefix="/stream", tags=["Real-time Stream"])
