from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "BookLeaf Author Support & Communication Portal"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "bookleaf_dev_secret_key_change_in_production_jwt_signing_token_123"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALGORITHM: str = "HS256"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./bookleaf.db"

    @field_validator("DATABASE_URL", mode="before")
    def assemble_database_url(cls, v: str) -> str:
        if not v:
            return "sqlite+aiosqlite:///./bookleaf.db"
        # Standardize PostgreSQL URLs for asyncpg
        if v.startswith("postgres://"):
            v = v.replace("postgres://", "postgresql+asyncpg://", 1)
        elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
            v = v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # CORS
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins(self) -> List[str]:
        val = (self.BACKEND_CORS_ORIGINS or "").strip()
        if not val or val == "*":
            return ["*"]
        if val.startswith("[") and val.endswith("]"):
            try:
                import json
                parsed = json.loads(val)
                if isinstance(parsed, list):
                    return [str(x).strip() for x in parsed if str(x).strip()]
            except Exception:
                pass
        return [i.strip() for i in val.split(",") if i.strip()]

    # AI Configuration
    AI_PROVIDER: str = "mock"  # "mock", "openai", "anthropic", "gemini"
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()
