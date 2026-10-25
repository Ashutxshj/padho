from app.core.config import settings
from app.services.ai_service import BaseAIService
from app.services.mock_ai_service import MockAIService
from app.services.gemini_service import GeminiAIService


def get_ai_service() -> BaseAIService:
    """
    Returns the active AI service provider based on environment settings.
    If GEMINI_API_KEY is configured, engages GeminiAIService (with mock fallback).
    Otherwise defaults to the reliable deterministic MockAIService.
    """
    if settings.GEMINI_API_KEY or settings.AI_PROVIDER == "gemini":
        if settings.GEMINI_API_KEY:
            return GeminiAIService(api_key=settings.GEMINI_API_KEY)
    
    return MockAIService()
