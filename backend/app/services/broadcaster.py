import asyncio
import json
from datetime import datetime, timezone
from typing import AsyncGenerator, Dict, List, Optional


class Connection:
    def __init__(self, user_id: str, role: str, queue: asyncio.Queue):
        self.user_id = user_id
        self.role = role
        self.queue = queue


class EventBroadcaster:
    """In-memory event hub managing Server-Sent Events subscriptions."""

    def __init__(self):
        self._connections: List[Connection] = []
        self._lock = asyncio.Lock()

    async def connect(self, user_id: str, role: str) -> asyncio.Queue:
        queue = asyncio.Queue()
        conn = Connection(user_id=user_id, role=role, queue=queue)
        async with self._lock:
            self._connections.append(conn)
        return queue

    async def disconnect(self, queue: asyncio.Queue):
        async with self._lock:
            self._connections = [c for c in self._connections if c.queue != queue]

    async def publish(
        self,
        event_type: str,
        data: dict,
        target_author_id: Optional[str] = None
    ):
        """Dispatches an event to authorized listeners."""
        payload = {
            "event": event_type,
            "data": data,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        raw_message = f"event: {event_type}\ndata: {json.dumps(payload)}\n\n"

        async with self._lock:
            for conn in self._connections:
                # Admins receive all events; authors receive only their own
                if conn.role == "admin" or conn.user_id == target_author_id:
                    try:
                        conn.queue.put_nowait(raw_message)
                    except asyncio.QueueFull:
                        pass

    async def event_generator(
        self,
        user_id: str,
        role: str
    ) -> AsyncGenerator[str, None]:
        """Yields events from client queue with periodic heartbeat ping."""
        queue = await self.connect(user_id, role)
        try:
            # Send initial connection confirmation
            welcome = {
                "status": "connected",
                "user_id": user_id,
                "role": role,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
            yield f"event: system\ndata: {json.dumps(welcome)}\n\n"

            while True:
                try:
                    # Wait for message with 15-second heartbeat timeout
                    message = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield message
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat comment
                    yield ": ping\n\n"
        finally:
            await self.disconnect(queue)


broadcaster = EventBroadcaster()
