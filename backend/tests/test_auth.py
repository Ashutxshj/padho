import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "author1@bookleaf.com", "password": "AuthorPass123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "author1@bookleaf.com"
    assert data["user"]["role"] == "author"


@pytest.mark.asyncio
async def test_login_invalid_password(client: AsyncClient):
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "author1@bookleaf.com", "password": "WrongPassword"}
    )
    assert response.status_code == 401
    assert "Incorrect email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_get_current_user_me(client: AsyncClient, auth1_token: str):
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {auth1_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "TEST_AUTH_1"
    assert data["name"] == "Author One"
