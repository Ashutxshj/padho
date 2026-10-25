import json
import logging
from typing import Any, Dict, List, Optional
import httpx

from app.core.config import settings
from app.schemas.ai import ClassificationResult, PriorityResult, DraftResponseResult
from app.services.ai_service import BaseAIService
from app.services.mock_ai_service import MockAIService
from app.services.knowledge_base import get_relevant_knowledge_base_chunks

logger = logging.getLogger(__name__)


class GeminiAIService(BaseAIService):
    """
    Google Gemini AI Provider integration using direct async REST calls.
    Includes automatic JSON structured output and fallback to MockAIService on timeouts or errors.
    """

    def __init__(self, api_key: str, model: str = "gemini-1.5-flash"):
        self.api_key = api_key
        self.model = model
        self.api_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        self.fallback = MockAIService()

    async def _call_gemini(self, prompt: str, enforce_json: bool = True) -> str:
        """Execute request to Gemini REST API with strict 8-second timeout."""
        headers = {"Content-Type": "application/json"}
        generation_config: Dict[str, Any] = {"temperature": 0.2}
        if enforce_json:
            generation_config["responseMimeType"] = "application/json"

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": generation_config,
        }

        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(self.api_url, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            raise ValueError("Empty or invalid candidate response from Gemini API")

    async def classify_ticket(
        self,
        subject: str,
        description: str,
        book_meta: Optional[Dict[str, Any]] = None
    ) -> ClassificationResult:
        prompt = f"""
You are the ticket triage classifier for BookLeaf Publishing.
Classify this author support query into EXACTLY ONE of the following 6 categories:
1. Royalty & Payments
2. ISBN & Metadata Issues
3. Printing & Quality
4. Distribution & Availability
5. Book Status & Production Updates
6. General Inquiry

Author Query Subject: \"\"\"{subject}\"\"\"
Author Query Description: \"\"\"{description}\"\"\"

Respond with a JSON object with this exact schema:
{{
  "category": "<one of the 6 exact names above>",
  "confidence": <float between 0.0 and 1.0>,
  "rationale": "<1-sentence rationale for this categorization>"
}}
"""
        try:
            raw_json = await self._call_gemini(prompt, enforce_json=True)
            parsed = json.loads(raw_json)
            valid_categories = [
                "Royalty & Payments",
                "ISBN & Metadata Issues",
                "Printing & Quality",
                "Distribution & Availability",
                "Book Status & Production Updates",
                "General Inquiry",
            ]
            cat = parsed.get("category", "")
            if cat not in valid_categories:
                # Find closest or fallback
                for v in valid_categories:
                    if v.lower() in cat.lower():
                        cat = v
                        break
                else:
                    cat = "General Inquiry"

            return ClassificationResult(
                category=cat,
                confidence=float(parsed.get("confidence", 0.95)),
                rationale=parsed.get("rationale", "Classified by Gemini 1.5 Flash.")
            )
        except Exception as e:
            logger.warning(f"Gemini classify failed: {e}. Engaging fallback.")
            return await self.fallback.classify_ticket(subject, description, book_meta)

    async def score_priority(
        self,
        subject: str,
        description: str,
        book_meta: Optional[Dict[str, Any]] = None
    ) -> PriorityResult:
        book_info = json.dumps(book_meta) if book_meta else "None"
        prompt = f"""
You are the priority triage specialist for BookLeaf Publishing support operations.
Assign exactly one priority level to this ticket: Critical, High, Medium, or Low.

Priority Rules:
- Critical: Active legal dispute, prolonged payment lapse (>6 months), emergency account compromise.
- High: Overdue royalty balance meeting/exceeding ₹1,000 threshold, ISBN mismatch on live Amazon/Flipkart listings, severe printing defects (torn/misprinted author copies).
- Medium: Standard royalty queries under threshold, normal stock sync delay, production progress questions.
- Low: Author biography update requests, minor spelling corrections, compliments.

Author Query Subject: \"\"\"{subject}\"\"\"
Author Query Description: \"\"\"{description}\"\"\"
Book Metadata: {book_info}

Respond with a JSON object with this exact schema:
{{
  "priority": "<Critical|High|Medium|Low>",
  "urgency_score": <1 for Low, 2 for Medium, 3 for High, 4 for Critical>,
  "rationale": "<1-sentence business and SLA justification>"
}}
"""
        try:
            raw_json = await self._call_gemini(prompt, enforce_json=True)
            parsed = json.loads(raw_json)
            prio = parsed.get("priority", "Medium")
            if prio not in ("Critical", "High", "Medium", "Low"):
                prio = "Medium"

            return PriorityResult(
                priority=prio,
                urgency_score=int(parsed.get("urgency_score", 2)),
                rationale=parsed.get("rationale", "Prioritized by Gemini 1.5 Flash.")
            )
        except Exception as e:
            logger.warning(f"Gemini priority failed: {e}. Engaging fallback.")
            return await self.fallback.score_priority(subject, description, book_meta)

    async def draft_response(
        self,
        subject: str,
        description: str,
        book_meta: Optional[Dict[str, Any]] = None,
        author_name: Optional[str] = None,
        conversation_history: Optional[List[str]] = None
    ) -> DraftResponseResult:
        author_display = author_name or "Author"
        book_info = json.dumps(book_meta, indent=2) if book_meta else "General / Account Level"
        policy_chunks = get_relevant_knowledge_base_chunks(f"{subject} {description}")
        grounding_text = "\n\n".join(policy_chunks)

        prompt = f"""
You are an empathetic, highly professional author support specialist at BookLeaf Publishing.
Draft a response to the author query using ONLY the provided BookLeaf Knowledge Base and book metadata.

Strict Guidelines:
1. Tone: Empathetic, respectful, transparent, and collaborative. Authors are partners, not customers.
2. Acknowledge First: Always validate the author's concern before explaining procedures.
3. Factuality: NEVER invent royalty numbers, payment dates, print dates, or policy exceptions not present in the context.
4. Missing Information: If key information is missing, politely specify what needs verification.
5. Specific Next Step: Always conclude with an actionable next step and clear SLA (e.g., 24-48 hours, 5-7 business days).

Author Name: {author_display}
Subject: \"\"\"{subject}\"\"\"
Description: \"\"\"{description}\"\"\"
Associated Book & Financial Data:
{book_info}

OFFICIAL BOOKLEAF KNOWLEDGE BASE GROUNDING:
{grounding_text}

Respond with a JSON object:
{{
  "suggested_draft": "<full text of the draft response starting with Dear {author_display},>",
  "grounded_policies_used": ["<list of policies cited e.g. Royalty Policy 3.2, ISBN Policy 3.3>"],
  "confidence_score": 0.95
}}
"""
        try:
            raw_json = await self._call_gemini(prompt, enforce_json=True)
            parsed = json.loads(raw_json)
            return DraftResponseResult(
                suggested_draft=parsed.get("suggested_draft", ""),
                grounded_policies_used=parsed.get("grounded_policies_used", ["BookLeaf Knowledge Base"]),
                confidence_score=float(parsed.get("confidence_score", 0.95)),
                model_used=self.model
            )
        except Exception as e:
            logger.warning(f"Gemini draft generation failed: {e}. Engaging fallback.")
            return await self.fallback.draft_response(
                subject, description, book_meta, author_name, conversation_history
            )
