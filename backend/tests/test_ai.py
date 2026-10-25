import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_ai_draft_response_grounded(client: AsyncClient, auth1_token: str, admin_token: str):
    """Admin requests an AI draft response grounded in BookLeaf Knowledge Base."""
    create_res = await client.post(
        "/api/v1/tickets",
        json={
            "book_id": "TEST_BK_1",
            "subject": "Missing Royalty Payment",
            "description": "I published my book and have not received my ₹1,500 pending royalty payout."
        },
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    ticket_id = create_res.json()["id"]

    draft_res = await client.post(
        "/api/v1/ai/draft-response",
        json={"ticket_id": ticket_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert draft_res.status_code == 200
    data = draft_res.json()
    assert "suggested_draft" in data
    # Assert tone and knowledge base policy grounding
    draft_text = data["suggested_draft"]
    assert "BookLeaf" in draft_text
    assert "80/20" in draft_text or "quarterly" in draft_text or "₹1,000" in draft_text
    assert len(data["grounded_policies_used"]) > 0


@pytest.mark.asyncio
async def test_ai_classification_categories(client: AsyncClient, admin_token: str):
    """Test AI classification across different domains."""
    queries = [
        ("I received author copies but pages are torn and print is blurry", "Printing & Quality"),
        ("My book shows currently unavailable on Amazon India", "Distribution & Availability"),
        ("The ISBN on Amazon does not match the printed barcode", "ISBN & Metadata Issues"),
        ("When will typesetting and proofreading be finished?", "Book Status & Production Updates"),
    ]
    for text, expected_cat in queries:
        res = await client.post(
            "/api/v1/ai/classify",
            json={"subject": "Support Request", "description": text},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert res.status_code == 200
        assert res.json()["category"] == expected_cat
