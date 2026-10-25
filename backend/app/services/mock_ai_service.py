import re
from typing import Any, Dict, List, Optional
from app.schemas.ai import ClassificationResult, PriorityResult, DraftResponseResult
from app.services.ai_service import BaseAIService
from app.services.knowledge_base import get_relevant_knowledge_base_chunks


class MockAIService(BaseAIService):
    """
    Deterministic rule-grounded AI provider that simulates LLM structured outputs
    with zero external API costs, perfect reliability, and strict policy grounding.
    """

    async def classify_ticket(
        self,
        subject: str,
        description: str,
        book_meta: Optional[Dict[str, Any]] = None
    ) -> ClassificationResult:
        text = f"{subject} {description}".lower()

        # 1. Royalty & Payments
        if any(w in text for w in ["royalty", "payment", "payout", "net profit", "bank", "threshold", "transfer", "credited", "earned", "unpaid"]):
            return ClassificationResult(
                category="Royalty & Payments",
                confidence=0.96,
                rationale="The inquiry explicitly references royalty amounts, quarterly cycles, or payment disbursements."
            )

        # 2. ISBN & Metadata Issues
        if any(w in text for w in ["isbn", "metadata", "imprint", "barcode", "wrong book linked", "mismatch"]):
            return ClassificationResult(
                category="ISBN & Metadata Issues",
                confidence=0.95,
                rationale="The query centers around ISBN assignment, barcode data, or catalog metadata synchronization."
            )

        # 3. Printing & Quality
        if any(w in text for w in ["print", "defect", "misprint", "binding", "blurry", "cover finish", "pages misaligned", "paper quality"]):
            return ClassificationResult(
                category="Printing & Quality",
                confidence=0.94,
                rationale="Author reports physical copy defects, binding problems, or print fidelity concerns."
            )

        # 4. Distribution & Availability
        if any(w in text for w in ["amazon", "flipkart", "store", "unavailable", "out of stock", "listing", "currently unavailable", "delisted"]):
            return ClassificationResult(
                category="Distribution & Availability",
                confidence=0.95,
                rationale="The inquiry involves retail channel listing status, stock synchronization, or availability."
            )

        # 5. Book Status & Production Updates
        if any(w in text for w in ["typesetting", "proofreading", "cover design", "manuscript", "production", "when will it be done", "stage", "delay"]):
            return ClassificationResult(
                category="Book Status & Production Updates",
                confidence=0.93,
                rationale="Query seeks progress updates on pre-publication production pipeline milestones."
            )

        # 6. Fallback General Inquiry
        return ClassificationResult(
            category="General Inquiry",
            confidence=0.88,
            rationale="General publishing inquiry or account administrative question."
        )

    async def score_priority(
        self,
        subject: str,
        description: str,
        book_meta: Optional[Dict[str, Any]] = None
    ) -> PriorityResult:
        text = f"{subject} {description}".lower()

        # Check for Critical keywords
        if any(w in text for w in ["legal", "lawyer", "breach", "6 months", "six months", "never received", "emergency", "fraud"]):
            return PriorityResult(
                priority="Critical",
                urgency_score=4,
                rationale="Identified severe payment lapse (>6 months), legal escalation risk, or severe account grievance."
            )

        # Check for High keywords or conditions
        is_isbn_mismatch = any(w in text for w in ["isbn", "mismatch", "different isbn", "wrong book"])
        is_overdue_royalty = any(w in text for w in ["overdue", "not credited", "pending royalty", "missing royalty"])
        has_substantial_pending = book_meta and book_meta.get("royalty_pending", 0) >= 1000
        is_print_defect = any(w in text for w in ["terrible", "defective", "misaligned", "unusable", "blurry", "damaged"])

        if is_isbn_mismatch or (is_overdue_royalty and has_substantial_pending) or is_print_defect:
            return PriorityResult(
                priority="High",
                urgency_score=3,
                rationale="High business impact: ISBN metadata defect, verified royalty balance above ₹1,000 threshold, or defective author copies."
            )

        # Check for Low keywords
        if any(w in text for w in ["author bio", "biography", "spelling", "compliment", "thank you", "minor", "just asking"]):
            return PriorityResult(
                priority="Low",
                urgency_score=1,
                rationale="Non-urgent inquiry involving minor metadata updates or general author feedback."
            )

        # Default Medium
        return PriorityResult(
            priority="Medium",
            urgency_score=2,
            rationale="Standard operational ticket requiring normal support turnaround within 24–48 hours."
        )

    async def draft_response(
        self,
        subject: str,
        description: str,
        book_meta: Optional[Dict[str, Any]] = None,
        author_name: Optional[str] = None,
        conversation_history: Optional[List[str]] = None
    ) -> DraftResponseResult:
        text = f"{subject} {description}".lower()
        author_display = author_name or "Author"
        book_title = book_meta.get("title", "your book") if book_meta else "your book"

        chunks = get_relevant_knowledge_base_chunks(f"{subject} {description}")

        # Scenario 1: Royalty Inquiry
        if any(w in text for w in ["royalty", "payment", "payout", "earned", "money", "pending"]):
            pending_amount = book_meta.get("royalty_pending", 0) if book_meta else None
            payout_date = book_meta.get("last_royalty_payout_date") if book_meta else None
            
            if pending_amount and pending_amount < 1000:
                draft = (
                    f"Dear {author_display},\n\n"
                    f"Thank you for contacting BookLeaf Support regarding your royalties for '{book_title}'.\n\n"
                    f"We have checked your sales figures: your current accumulated royalty is ₹{pending_amount}. "
                    f"As per BookLeaf's Royalty Policy, royalties are calculated quarterly with a minimum payout threshold of ₹1,000. "
                    f"Because your current balance is under this threshold, it will safely roll over into the next quarter and be disbursed once your accumulated earnings reach ₹1,000.\n\n"
                    f"You can view the full platform-wise breakdown on your author dashboard anytime. Please let us know if you need any additional clarification!\n\n"
                    f"Warm regards,\nBookLeaf Author Support Team"
                )
            else:
                amount_str = f"₹{pending_amount:,}" if pending_amount else "your pending royalty balance"
                payout_info = f" Your last recorded payout was on {payout_date}." if payout_date else ""
                draft = (
                    f"Dear {author_display},\n\n"
                    f"Thank you for reaching out to us. We understand how important timely payouts are, and we appreciate you bringing this to our attention regarding '{book_title}'.\n\n"
                    f"According to our records, your current pending royalty balance is {amount_str}.{payout_info} "
                    f"Under BookLeaf's policy, royalties are calculated on an 80/20 net profit split and distributed quarterly within 45 days of the quarter ending. "
                    f"Because your balance meets our ₹1,000 payout threshold, we have escalated your account to our finance desk to verify your linked bank transfer details.\n\n"
                    f"Our finance team will complete this verification within 48 hours and notify you as soon as the transfer reference is generated.\n\n"
                    f"Warm regards,\nBookLeaf Author Support Team"
                )
            return DraftResponseResult(
                suggested_draft=draft,
                grounded_policies_used=["Royalty Policy 3.2", "Communication Guidelines 3.7"],
                confidence_score=0.96,
                model_used="deterministic-grounded-mock-v1"
            )

        # Scenario 2: ISBN Mismatch
        if any(w in text for w in ["isbn", "metadata", "imprint"]):
            isbn_str = book_meta.get("isbn", "the assigned ISBN") if book_meta else "the assigned ISBN"
            draft = (
                f"Dear {author_display},\n\n"
                f"Thank you for reaching out, and we apologize for any confusion regarding the ISBN for '{book_title}'.\n\n"
                f"We treat ISBN mismatches with the highest priority. The registered ISBN under BookLeaf's imprint is {isbn_str}. "
                f"We have immediately escalated this issue to our production and distribution desk to verify and synchronize the metadata across all retail channels.\n\n"
                f"Our team will investigate the listing discrepancies and provide an update within 48 hours. Thank you for your patience while we resolve this.\n\n"
                f"Warm regards,\nBookLeaf Author Support Team"
            )
            return DraftResponseResult(
                suggested_draft=draft,
                grounded_policies_used=["ISBN Policy 3.3", "Communication Guidelines 3.7"],
                confidence_score=0.95,
                model_used="deterministic-grounded-mock-v1"
            )

        # Scenario 3: Printing & Quality Issues
        if any(w in text for w in ["print", "quality", "defect", "misprint", "binding", "blurry", "damaged"]):
            draft = (
                f"Dear {author_display},\n\n"
                f"We sincerely apologize for the quality issue you experienced with your author copies of '{book_title}'. Authors are our partners, and we take our print quality very seriously.\n\n"
                f"Under BookLeaf's Quality Guarantee, we provide a 100% free reprint for copies with binding defects, misprints, or print inconsistencies. "
                f"Could you please share a few clear photos showing the defective areas (cover, spine, and misaligned pages)?\n\n"
                f"Once verified by our printing team in Delhi, we will initiate a priority reprint within 5–7 business days at no cost to you.\n\n"
                f"Warm regards,\nBookLeaf Author Support Team"
            )
            return DraftResponseResult(
                suggested_draft=draft,
                grounded_policies_used=["Printing & Quality Policy 3.4", "Communication Guidelines 3.7"],
                confidence_score=0.95,
                model_used="deterministic-grounded-mock-v1"
            )

        # Scenario 4: Distribution & Availability
        if any(w in text for w in ["amazon", "flipkart", "unavailable", "stock", "out of stock", "listing"]):
            channels = ", ".join(book_meta.get("available_on", [])) if book_meta else "our partner channels"
            draft = (
                f"Dear {author_display},\n\n"
                f"Thank you for contacting us regarding the availability of '{book_title}' on Amazon.\n\n"
                f"When a published book temporarily displays as 'Currently Unavailable', it is typically a stock feed synchronization issue between our central warehouse and Amazon's catalog. "
                f"We have triggered a manual stock re-sync with our distribution team.\n\n"
                f"The inventory status should reflect accurately within 24 to 48 hours. We will follow up to ensure the listing is actively accepting orders.\n\n"
                f"Warm regards,\nBookLeaf Author Support Team"
            )
            return DraftResponseResult(
                suggested_draft=draft,
                grounded_policies_used=["Distribution Policy 3.5", "Communication Guidelines 3.7"],
                confidence_score=0.94,
                model_used="deterministic-grounded-mock-v1"
            )

        # Scenario 5: Production Update
        if any(w in text for w in ["production", "typesetting", "proof", "cover design", "stage"]):
            stage_str = book_meta.get("status", "current production") if book_meta else "current production"
            draft = (
                f"Dear {author_display},\n\n"
                f"Thank you for following up on the status of '{book_title}'.\n\n"
                f"Your book is currently in the '{stage_str}' milestone. Our production team works carefully through each phase—from manuscript intake to typesetting and proofreading—to ensure the highest editorial standards.\n\n"
                f"We have checked with our production coordinator: your updated proofs are scheduled for review within the next 3 business days. You will receive an email notification as soon as they are ready for your approval.\n\n"
                f"Warm regards,\nBookLeaf Author Support Team"
            )
            return DraftResponseResult(
                suggested_draft=draft,
                grounded_policies_used=["Production Stages 3.6", "Communication Guidelines 3.7"],
                confidence_score=0.93,
                model_used="deterministic-grounded-mock-v1"
            )

        # Default Grounded Draft
        draft = (
            f"Dear {author_display},\n\n"
            f"Thank you for reaching out to BookLeaf Publishing. We have received your query regarding '{book_title}'.\n\n"
            f"Our author support team is currently reviewing your details. We strive to provide transparent, comprehensive assistance for all publishing and distribution inquiries.\n\n"
            f"We will provide a full update within 24–48 hours. Please let us know if there is any additional context you would like to share.\n\n"
            f"Warm regards,\nBookLeaf Author Support Team"
        )
        return DraftResponseResult(
            suggested_draft=draft,
            grounded_policies_used=["Company Overview 3.1", "Communication Guidelines 3.7"],
            confidence_score=0.90,
            model_used="deterministic-grounded-mock-v1"
        )
