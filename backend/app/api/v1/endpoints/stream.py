from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from app.core.deps import get_current_user
from app.core.security import decode_access_token
from app.models.user import User
from app.services.broadcaster import broadcaster

router = APIRouter()


@router.get("/tickets")
async def stream_ticket_events(
    token: str = Query(..., description="JWT access token passed in query parameter for EventSource"),
):
    """
    Server-Sent Events (SSE) endpoint delivering real-time ticket and message updates.
    Authors receive updates for their tickets; admins receive all events across the catalog.
    """
    payload = decode_access_token(token)
    if not payload or not payload.get("sub"):
        return StreamingResponse(
            iter(["event: error\ndata: {\"error\": \"Invalid or expired token\"}\n\n"]),
            media_type="text/event-stream"
        )

    user_id = payload["sub"]
    role = payload.get("role", "author")

    return StreamingResponse(
        broadcaster.event_generator(user_id=user_id, role=role),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        }
    )
