"""BookLeaf Publishing Official Knowledge Base and Selective Context Retrieval Engine."""

from typing import Dict, List

KNOWLEDGE_BASE_SECTIONS: Dict[str, str] = {
    "company_overview": """BookLeaf Publishing Company Overview:
- Self-publishing company operating across India and the United States.
- Publishing packages: Standard Free (no upfront fee) and Bestseller Breakthrough (premium paid package with marketing & distribution add-ons).
- In-house printing facility and warehouse located in Delhi.
- External print partners: Repro India and Epitome Books.
- Services include cover design, typesetting, ISBN assignment, printing, distribution, and royalty management.""",

    "royalty_policy": """BookLeaf Royalty Policy:
- Royalty split: 80/20 split — 80% of net profit goes to author, 20% to BookLeaf.
- Net Profit formula: Net Profit = MRP - (Printing Cost + Platform Commission [Amazon/Flipkart] + Shipping Charges).
- Calculation & Schedule: Calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold: ₹1,000. Accumulated royalties below ₹1,000 automatically roll over to the subsequent quarter.
- Payment method: Direct electronic bank transfer to the bank account linked in the author dashboard.
- Authors can view a detailed breakdown of sales and royalties per platform on their dashboard.""",

    "isbn_policy": """BookLeaf ISBN Policy:
- Every book published receives a unique ISBN assigned under BookLeaf's publisher imprint.
- If an author desires an ISBN under their personal independent imprint, they must obtain it independently.
- ISBN errors (mismatches on Amazon/retail platforms, wrong book linked) are treated as High Priority production defects and escalated directly to the production team with a 48-hour resolution SLA.""",

    "printing_quality": """BookLeaf Printing & Quality Policy:
- In-house printing facility in Delhi handles standard orders; overflow or specialized bindings go to Repro India or Epitome Books.
- Standard turnaround time: 5–7 business days from order confirmation.
- Quality issues (misprints, binding defects, color inconsistency, missing pages): BookLeaf arranges a 100% free reprint after photo verification. Authors are asked to submit clear photos of the defective copies.""",

    "distribution_availability": """BookLeaf Distribution & Availability Policy:
- Channels: Amazon India, Flipkart, Amazon US, Amazon UK, and BookLeaf Store.
- New book listings typically go live within 7–10 business days after publication is finalized.
- 'Currently Unavailable' status: Typically an inventory/stock synchronization issue. BookLeaf ops can trigger a re-sync with the distribution team within 24–48 hours to restore live purchasing.""",

    "production_stages": """BookLeaf Production Milestones:
- Sequence: Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
- Authors receive email notifications at each milestone.
- Common delay bottlenecks: Cover Design (waiting for author proof approvals) and Proofreading (author revision rounds).""",

    "communication_guidelines": """BookLeaf Communication Tone Guidelines:
- Tone: Empathetic, respectful, transparent, and collaborative. Authors are our publishing partners, not support tickets.
- Acknowledge First: Always validate the author's concern or frustration before explaining policies.
- Specifics over platitudes: Quote exact figures, titles, dates, and percentages.
- Ownership: If BookLeaf caused an error (e.g. late payment, ISBN mismatch), apologize sincerely without corporate deflection.
- Concrete SLAs: Give specific timelines (e.g. 'within 48 hours', '5-7 business days'). Always provide a clear next step."""
}


def get_relevant_knowledge_base_chunks(query: str, category: str | None = None) -> List[str]:
    """
    Intelligently retrieves only the relevant Knowledge Base sections matching
    the query content and category, keeping token consumption minimal and targeted.
    """
    chunks: List[str] = [KNOWLEDGE_BASE_SECTIONS["communication_guidelines"]]
    query_lower = query.lower()

    # Category or Keyword mapping
    if category == "Royalty & Payments" or any(k in query_lower for k in ["royalty", "payment", "money", "threshold", "bank", "account", "net profit", "paid", "payout"]):
        chunks.append(KNOWLEDGE_BASE_SECTIONS["royalty_policy"])

    if category == "ISBN & Metadata Issues" or any(k in query_lower for k in ["isbn", "imprint", "barcode", "metadata", "title wrong", "mismatch"]):
        chunks.append(KNOWLEDGE_BASE_SECTIONS["isbn_policy"])

    if category == "Printing & Quality" or any(k in query_lower for k in ["print", "defect", "misprint", "binding", "paper", "quality", "blurry", "damaged"]):
        chunks.append(KNOWLEDGE_BASE_SECTIONS["printing_quality"])

    if category == "Distribution & Availability" or any(k in query_lower for k in ["amazon", "flipkart", "store", "unavailable", "out of stock", "listing", "live", "distribution"]):
        chunks.append(KNOWLEDGE_BASE_SECTIONS["distribution_availability"])

    if category == "Book Status & Production Updates" or any(k in query_lower for k in ["stage", "typesetting", "proof", "cover design", "editing", "manuscript", "progress"]):
        chunks.append(KNOWLEDGE_BASE_SECTIONS["production_stages"])

    # If general or empty matches, provide company overview
    if len(chunks) == 1:
        chunks.append(KNOWLEDGE_BASE_SECTIONS["company_overview"])

    return chunks
