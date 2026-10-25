import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_author_books_isolation(client: AsyncClient, auth1_token: str):
    """Assert author 1 only sees their own books."""
    response = await client.get(
        "/api/v1/books",
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["id"] == "TEST_BK_1"
    assert data["items"][0]["title"] == "Author 1 Book"


@pytest.mark.asyncio
async def test_admin_sees_all_books(client: AsyncClient, admin_token: str):
    """Assert admin sees books across all authors."""
    response = await client.get(
        "/api/v1/books",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_author_royalty_summary(client: AsyncClient, auth1_token: str):
    """Assert royalty calculation totals and payout eligibility."""
    response = await client.get(
        "/api/v1/books/summary/royalties",
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total_earned"] == 3500
    assert data["total_paid"] == 2000
    assert data["total_pending"] == 1500
    assert data["eligible_for_payout"] is True
