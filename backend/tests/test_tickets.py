import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_ticket_with_owned_book(client: AsyncClient, auth1_token: str):
    """Author 1 creates ticket linking their own book BK_1."""
    payload = {
        "book_id": "TEST_BK_1",
        "subject": "Missing Royalty Payout",
        "description": "My book earned ₹1,500 pending royalty that has not arrived yet."
    }
    response = await client.post(
        "/api/v1/tickets",
        json=payload,
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["subject"] == payload["subject"]
    assert data["book_id"] == "TEST_BK_1"
    assert data["status"] == "Open"
    # AI enrichment should categorize as Royalty & Payments
    assert data["category"] == "Royalty & Payments"
    assert data["priority"] in ("Critical", "High", "Medium", "Low")
    assert data["ai_processing_status"] == "COMPLETED"


@pytest.mark.asyncio
async def test_create_ticket_with_unowned_book_fails(client: AsyncClient, auth1_token: str):
    """Author 1 attempts to link Author 2's book BK_2; must be rejected with 403."""
    payload = {
        "book_id": "TEST_BK_2",
        "subject": "Trying to access other book",
        "description": "This should be rejected by server-side validation."
    }
    response = await client.post(
        "/api/v1/tickets",
        json=payload,
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    assert response.status_code == 403
    assert "cannot link a book that does not belong to your account" in response.json()["detail"]


@pytest.mark.asyncio
async def test_admin_queue_and_override(client: AsyncClient, auth1_token: str, admin_token: str):
    """Author creates ticket; Admin views in queue and overrides category & priority."""
    create_res = await client.post(
        "/api/v1/tickets",
        json={
            "book_id": "TEST_BK_1",
            "subject": "General Query",
            "description": "Just wondering about my book cover and publication timeline."
        },
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    ticket_id = create_res.json()["id"]

    # Admin lists queue
    queue_res = await client.get(
        "/api/v1/tickets",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert queue_res.status_code == 200
    assert queue_res.json()["total"] >= 1

    # Admin overrides priority to Critical
    patch_res = await client.patch(
        f"/api/v1/tickets/{ticket_id}",
        json={"priority": "Critical", "status": "In Progress"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert patch_res.status_code == 200
    patched_data = patch_res.json()
    assert patched_data["priority"] == "Critical"
    assert patched_data["status"] == "In Progress"


@pytest.mark.asyncio
async def test_messaging_and_internal_notes(client: AsyncClient, auth1_token: str, admin_token: str):
    """Test reply messaging and internal note isolation."""
    create_res = await client.post(
        "/api/v1/tickets",
        json={
            "subject": "Need help with distribution",
            "description": "My book is not showing up on Flipkart."
        },
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    ticket_id = create_res.json()["id"]

    # Admin posts a public reply
    msg_res = await client.post(
        f"/api/v1/tickets/{ticket_id}/messages",
        json={"message_body": "We have triggered a stock re-sync with Flipkart."},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert msg_res.status_code == 201

    # Admin adds internal note
    note_res = await client.post(
        f"/api/v1/tickets/{ticket_id}/internal-notes",
        json={"note_text": "Flipkart merchant catalog batch ID #98231 triggered."},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert note_res.status_code == 201

    # Author attempts to view internal notes -> MUST BE REJECTED 403
    leak_test = await client.get(
        f"/api/v1/tickets/{ticket_id}/internal-notes",
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    assert leak_test.status_code == 403
