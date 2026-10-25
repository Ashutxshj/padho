from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.schemas.user import Token, UserLogin, UserOut

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    payload: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate with email and password, returning JWT bearer token and user profile."""
    result = await db.execute(select(User).where(User.email == payload.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    access_token = create_access_token(
        subject=user.id,
        role=user.role
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut.model_validate(user)
    )


@router.get("/me", response_model=UserOut)
async def read_current_user(
    current_user: User = Depends(get_current_user)
):
    """Get the profile of the currently authenticated token bearer."""
    return current_user


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """Stateless logout confirmation."""
    return {"message": "Logged out successfully"}
