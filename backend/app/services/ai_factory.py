from app.core.config import settings
from app.services.ai_service import BaseAIService
from app.services.mock_ai_service import MockAIService


def get_ai_service() -> BaseAIService:
    """
    Returns the active AI service provider based on environment settings.
    Defaults to the reliable deterministic MockAIService.
    """
    if settings.AI_PROVIDER == "mock" or not (settings.OPENAI_API_KEY or settings.ANTHROPIC_API_KEY or settings.GEMINI_API_KEY):
        return MockAIService()
    
    # Live providers can be instantiated here if valid keys are provided
    return MockAIService()
