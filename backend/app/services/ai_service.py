from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from app.schemas.ai import ClassificationResult, PriorityResult, DraftResponseResult


class BaseAIService(ABC):
    """Abstract interface for BookLeaf AI services."""

    @abstractmethod
    async def classify_ticket(
        self,
        subject: str,
        description: str,
        book_meta: Optional[Dict[str, Any]] = None
    ) -> ClassificationResult:
        """Classify a support query into 1 of the 6 canonical categories."""
        pass

    @abstractmethod
    async def score_priority(
        self,
        subject: str,
        description: str,
        book_meta: Optional[Dict[str, Any]] = None
    ) -> PriorityResult:
        """Assign priority: Critical, High, Medium, or Low with business rationale."""
        pass

    @abstractmethod
    async def draft_response(
        self,
        subject: str,
        description: str,
        book_meta: Optional[Dict[str, Any]] = None,
        author_name: Optional[str] = None,
        conversation_history: Optional[List[str]] = None
    ) -> DraftResponseResult:
        """Generate empathetic, knowledge-grounded response draft."""
        pass
