import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client: AsyncClient):
    """Calling private route without token returns 401."""
    response = await client.get("/api/v1/books")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_cross_author_ticket_access_forbidden(client: AsyncClient, auth1_token: str, auth2_token: str):
    """Author 1 creates ticket; Author 2 attempts to read it; must be 403 Forbidden."""
    create_res = await client.post(
        "/api/v1/tickets",
        json={
            "subject": "Author 1 Private Query",
            "description": "Sensitive royalty questions regarding my earnings."
        },
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    ticket_id = create_res.json()["id"]

    # Author 2 attempts to access Author 1's ticket detail
    forbidden_res = await client.get(
        f"/api/v1/tickets/{ticket_id}",
        headers={"Authorization": f"Bearer {auth2_token}"}
    )
    assert forbidden_res.status_code == 403
    assert "do not have access" in forbidden_res.json()["detail"]


@pytest.mark.asyncio
async def test_author_cannot_execute_admin_patch(client: AsyncClient, auth1_token: str):
    """Author attempts to override ticket priority or status; must be 403."""
    response = await client.patch(
        "/api/v1/tickets/any-ticket-id",
        json={"status": "Closed"},
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    assert response.status_code == 403
    assert "privileges required" in response.json()["detail"].lower()
