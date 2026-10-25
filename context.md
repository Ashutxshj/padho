# BookLeaf Publishing — Author Support & Communication Portal
## Master Context & Technical Assignment Specification

---

## 1. Executive Summary & Assignment Meta

- **Project Name:** BookLeaf Author Support & Communication Portal
- **Role:** Full-Stack Developer Position (Technical Assignment 1 of 2)
- **Organization:** BookLeaf Publishing (Saloni Mourya, HR Specialist / Technical Review Team)
- **Repo Directory:** `padho` (Git remote: `https://github.com/Ashutxshj/padho.git`)
- **Submission Deliverables:**
  1. Source Code (Private GitHub repository, clean commit history)
  2. Live Deployed URL (Vercel / Railway / Render / VPS with pre-seeded database & test credentials)
  3. Comprehensive README Documentation (local setup, architectural decisions, AI integration, API docs, limitations)
  4. 1-Page Architectural & Approach Write-Up (trade-offs, prioritization, evolution to production)
- **Timeline Discrepancy Note:** Email states **4 days** from receipt; assignment document states **5 days**. As per engineering safeguards, work will be planned and completed aggressively against the **4-day** target.
- **Confidentiality:** Strictly confidential. Solution must not be published to public repositories or shared outside BookLeaf's authorized review team.

### Evaluation Criteria Breakdown
| Evaluation Criterion | Weight | Key Assessment Points |
| :--- | :---: | :--- |
| **AI Integration Quality** | **25%** | Prompt engineering, Knowledge Base grounding, response quality, classification accuracy, graceful degradation/fallback, cost awareness & token optimization. |
| **Architecture & Code Quality** | **25%** | Clean project structure, separation of concerns, meaningful abstractions, readable code, strict error handling, maintainability. |
| **API Design** | **15%** | RESTful conventions, auth middleware, Role-Based Access Control (RBAC), input validation, predictable error responses, OpenAPI/Swagger docs. |
| **Functionality & Completeness** | **15%** | Both author and admin portals fully functional, ticket lifecycle, real-time/near-real-time updates, handling dataset edge cases. |
| **Product Thinking** | **10%** | Practical author and operations UX, sensible defaults, intuitive queues and status workflows. |
| **Documentation & Communication** | **10%** | Comprehensive README, architecture notes, clean commit history, inline code comments, honest assumptions. |

---

## 2. Business Context & Operating Scale

BookLeaf Publishing is a leading self-publishing company operating across India and the United States:
- **Monthly Volume:** 1,200+ books processed per month.
- **Catalog Size:** 22,000+ active titles.
- **Author Network:** Thousands of authors across India and the US.
- **Current Bottleneck:** Support queries (royalties, ISBNs, printing defects, distribution status) are handled manually. This causes delayed replies, inconsistent communication, and operational backlogs during high-volume spikes.
- **Solution Goal:** A dual-portal web application (Author Portal + Admin Portal) with AI-assisted categorization, priority scoring, and knowledge-grounded response drafts, enabling the operations team to handle queries faster and transparently.

---

## 3. Official BookLeaf Knowledge Base (Authoritative Grounding Source)

The AI draft generation system and operations team must strictly ground all answers in these official policies:

### 3.1 Company Overview
- **Publishing Packages:**
  - *Standard Free:* No upfront cost.
  - *Bestseller Breakthrough:* Premium, paid package with marketing and distribution add-ons.
- **Scope of Services:** Cover design, typesetting, ISBN assignment, printing, distribution, and royalty management.
- **Print Facilities:**
  - In-house printing facility & warehouse located in **Delhi**.
  - Print partners: **Repro India** and **Epitome Books**.

### 3.2 Royalty Policy
- **Royalty Split:** 80/20 split — **80% of net profit** per book goes to author, **20%** to BookLeaf.
- **Net Profit Formula:** $\text{Net Profit} = \text{MRP} - (\text{Printing Cost} + \text{Platform Commission [Amazon/Flipkart]} + \text{Shipping Charges})$.
- **Payout Frequency & Cycle:** Calculated quarterly; paid within **45 days** of the quarter ending.
- **Minimum Threshold:** **₹1,000**. If accumulated royalties are below ₹1,000, they roll over to the subsequent quarter.
- **Payment Method:** Direct bank transfer to the account linked in the author's dashboard.
- **Transparency:** Authors can view detailed sales and royalty breakdowns per platform on their dashboard.

### 3.3 ISBN Policy
- **Imprint:** Every book published receives a unique ISBN assigned under BookLeaf's publisher imprint.
- **Independent Imprints:** If an author requests an ISBN under their personal imprint, they must obtain it independently.
- **ISBN Errors:** Any duplicate or mismatched ISBN is classified as **High Priority** and immediately escalated to the production team.

### 3.4 Printing & Quality Policy
- **Print Execution:** In-house printing handles most orders; overflow or specialized formats route to Repro India or Epitome Books.
- **Standard Turnaround:** **5–7 business days** from order confirmation.
- **Quality Defects (misprints, binding issues, color inconsistency):** BookLeaf provides a **free reprint** after photo verification.

### 3.5 Distribution & Availability Policy
- **Sales Channels:** Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store.
- **Listing Turnaround:** New listings go live within **7–10 business days** post-publication.
- **"Currently Unavailable" Status:** Typically a platform inventory sync issue. BookLeaf ops can trigger a re-sync within **24–48 hours**.

### 3.6 Production Pipeline Stages
1. Manuscript Received
2. Editing (if opted)
3. Cover Design *(Key delay bottleneck: waiting for author approval)*
4. Typesetting
5. Proofreading *(Key delay bottleneck: author revision rounds)*
6. ISBN Assignment
7. Printing
8. Distribution Setup
9. Published & Live

Authors receive email notifications at each milestone.

### 3.7 Communication Tone Guidelines
1. **Empathetic & Professional:** Authors are valued creative partners, not support tickets.
2. **Acknowledge First:** Validate the author's emotion/concern before diving into technical explanations.
3. **Fact-Based & Specific:** Cite exact numbers, dates, platforms, and book titles. Avoid vague platitudes.
4. **Ownership:** If BookLeaf is at fault (e.g., payment delay, ISBN error), apologize sincerely and take full ownership without corporate deflection.
5. **Concrete Timelines:** Commit to realistic windows (e.g., "within 48 hours", "5–7 business days") rather than open-ended promises.
6. **Actionable Next Steps:** Always conclude with the immediate next step for BookLeaf and/or the author.

### 3.8 Reference Calibration Examples
| Category | Sample Author Query | Expected Response Tone & Content |
| :--- | :--- | :--- |
| **Royalty & Payments** | *"I published my book 4 months ago and still haven’t received any royalty. What’s going on?"* | Acknowledge frustration. Explain quarterly cycle + 45-day window. Check if bank details are linked. Provide next payout date. If overdue, escalate with 48-hour resolution timeline. |
| **Royalty & Payments** | *"My royalty amount seems too low. I sold 200 copies but only received ₹3,000."* | Explain Net Profit formula (MRP - printing - platform cut - shipping). Offer detailed platform breakdown. Maintain transparency without defensiveness. |
| **ISBN & Metadata** | *"My book is showing a different ISBN on Amazon than what’s on the physical copy."* | Treat as high priority. Acknowledge severity of data mismatch. Confirm immediate escalation to production with 48-hour SLA. |
| **Printing & Quality** | *"I received my author copies and the print quality is terrible. The images are blurry and pages are misaligned."* | Apologize sincerely. Request photos of defects. Confirm free reprint upon verification within 5–7 business days. |
| **Distribution** | *"My book is published but it’s showing as 'Currently Unavailable' on Amazon."* | Explain stock sync phenomenon. Confirm triggering manual re-sync with distribution. Set 24–48 hour timeline for listing restoration. |
| **Production Updates** | *"It’s been 3 weeks and my book is still in typesetting. When will it be done?"* | Inspect actual stage. Explain reasons honestly (e.g. proofing/approval). Provide clear updated schedule collaboratively. |
| **General Inquiry** | *"Can I update the description of my book on Amazon after it’s already live?"* | Affirm that metadata updates can be submitted via dashboard or email. Confirm 3–5 business day platform reflection time. |

---

## 4. Sample Dataset Analysis (`bookleaf_sample_data.json`)

The dataset comprises **10 Authors** and **18 Books** reflecting production and financial variations:

### 4.1 Author Entity Structure
- `author_id`: String (`AUTH001` - `AUTH010`)
- `name`: Full Name
- `email`: Valid Email format
- `phone`: Contact string (e.g., `+91-98765-43210`)
- `city`: Indian metro/tier-2 cities (Mumbai, Delhi, Hyderabad, Pune, Kochi, Chandigarh, Bangalore, Lucknow, Nagpur, Kolkata)
- `joined_date`: ISO Date format (`YYYY-MM-DD`)
- `books`: Array of associated book records

### 4.2 Book Entity Structure & Edge Cases
| Field | Type | Description / Edge Cases |
| :--- | :--- | :--- |
| `book_id` | String | Unique ID (`BK001` - `BK018`) |
| `title` | String | Book Title |
| `isbn` | String | Formatted ISBN (e.g., `978-93-5XXXX-01-1`) |
| `genre` | String | Genre classification |
| `publication_date` | String / Null | Null for books currently in production |
| `status` | String | `"Published & Live"`, `"In Production - Cover Design"` (`BK013`), `"In Production - Typesetting"` (`BK015`) |
| `mrp` | Integer / Null | Pricing in INR; Null for books in production |
| `author_royalty_per_copy` | Integer / Null | Per-copy royalty; Null for books in production |
| `total_copies_sold` | Integer | Total sales volume |
| `total_royalty_earned` | Integer | Calculated earned amount |
| `royalty_paid` | Integer | Historical amount disbursed |
| `royalty_pending` | Integer | Unpaid balance (Strict invariant: `total_royalty_earned - royalty_paid`) |
| `last_royalty_payout_date` | String / Null | Date of last transfer, or `null` if unpaid / in production |
| `print_partner` | String / Null | `"In-House"`, `"Repro India"`, `"Epitome Books"`, or `null` |
| `available_on` | Array[String] | Channels (Amazon India, Flipkart, Amazon US, Amazon UK, BookLeaf Store), or empty `[]` |

### 4.3 Key Edge Cases to Support in UI & API
1. **Unpaid Accumulated Royalties:** E.g., `AUTH003` (Ananya Reddy, BK005: ₹2,546 pending, payout date `null`), `AUTH006` (Arjun Malhotra, BK010: ₹2,464 pending).
2. **Sub-Threshold Royalties:** E.g., `AUTH009` (Kavita Deshmukh, BK016: ₹850 earned & pending — below the ₹1,000 payout threshold!).
3. **Books in Production:** `BK013` (*Midnight in Mysore*, Cover Design stage) and `BK015` (*Raising Roots*, Typesetting stage) have `null` publication dates, zero royalties, no print partners, and empty distribution arrays.
4. **Zero Pending Balance:** Authors with full payouts (`royalty_pending: 0`), such as `AUTH001` BK002, `AUTH004` BK007, `AUTH005` BK008.

---

## 5. System Requirements Matrix

### 5.1 Author Portal
- [x] **Email & Password Authentication:** Secure session/JWT, bcrypt/Argon2 password hashing, demo credentials pre-seeded.
- [x] **Author Data Isolation:** Authenticated user can ONLY view their own books and tickets. Hard server-side enforcement.
- [x] **My Books View:** Clean presentation of all books with ISBN, genre, MRP, publication date/status, units sold, total earned, paid, and pending balance.
- [x] **Support Query Submission:**
  - Select Book dropdown (scoped to author's catalog) OR "General / Account Level".
  - Subject input + detailed query textarea.
  - Optional file attachment UI (with server validation if file upload enabled).
  - Validation: rejects spoofed book IDs belonging to other authors.
- [x] **My Tickets View:** Real-time / near-real-time updates (SSE or responsive polling) displaying status (`Open`, `In Progress`, `Resolved`, `Closed`), timestamps, query body, and admin responses.
- [x] **Privacy Boundary:** Authors must NEVER receive internal admin notes or internal AI reasoning payloads.

### 5.2 Admin Portal
- [x] **Unified Ticket Queue:** View all tickets across all authors with search, pagination, and sorting by urgency and age.
- [x] **Multi-Criteria Filtering:** Filter by Status, Category, Priority, and Date Range.
- [x] **AI Auto-Classification:** Categorizes incoming tickets into exactly one of:
  1. *Royalty & Payments*
  2. *ISBN & Metadata Issues*
  3. *Printing & Quality*
  4. *Distribution & Availability*
  5. *Book Status & Production Updates*
  6. *General Inquiry*
- [x] **AI Priority Scoring:** Rates tickets (*Critical*, *High*, *Medium*, *Low*) with rationale based on business impact, financial urgency, and SLA risks.
- [x] **Admin Override Tracking:** Allows ops staff to override AI category & priority; stores both AI suggestions and final human decisions for auditability.
- [x] **AI-Drafted Knowledge-Grounded Responses:**
  - Grounded in ticket context, associated book metadata, and official BookLeaf policies.
  - Sounds like a compassionate, competent BookLeaf representative.
  - Zero hallucination policy: does not fabricate payments, dates, or unauthorized promises.
  - Interactive editor allowing admin to review and edit before sending.
- [x] **Ticket Management Operations:** Status updates, ticket assignment to self/staff, and private internal notes.

### 5.3 API & Backend Architecture
- **Framework:** FastAPI (Python 3.10+) for type safety, Pydantic schemas, auto-generated OpenAPI documentation, and asynchronous capabilities.
- **ORM & Database:** SQLAlchemy 2.0 with Alembic migrations. PostgreSQL for production; robust SQLite compatibility for automated local testing.
- **Security:** JWT authentication tokens, bcrypt password hashing, CORS whitelist, parameter validation, rate limiting on AI/sensitive endpoints.
- **Real-Time Mechanism:** Server-Sent Events (SSE) `/api/tickets/stream` with lightweight polling fallback.

### 5.4 AI Integration Safeguards & Principles
- **Provider Layer:** Abstract `AIService` interface supporting LLM providers (e.g., OpenAI `gpt-4o-mini`, Anthropic `claude-3-haiku`, or Gemini) alongside a **Deterministic Mock AI Provider** for offline/zero-cost local development and automated CI.
- **Resilience:** Async ticket persistence prior to AI enrichment. Timeouts, backoff retries, and sensible fallbacks (`General Inquiry`, `Medium` priority) if AI is unresponsive or rate-limited.
- **Token & Cost Efficiency:** Context-aware prompt trimming; selectively injects relevant Knowledge Base sections rather than dumping the full document on every call.

---

## 6. Target Architecture & Project Structure

```
padho/
├── context.md                         # This master context and requirements document
├── bookleaf_sample_data.json          # Master sample dataset (10 authors, 18 books)
├── README.md                          # Master project documentation & local setup guide
├── docker-compose.yml                 # Multi-container orchestration (backend, frontend, postgres)
│
├── backend/                           # FastAPI Application
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── auth.py        # Login, user profile, token refresh
│   │   │   │   │   ├── books.py       # Author books catalog & financial summaries
│   │   │   │   │   ├── tickets.py     # Ticket CRUD, filtering, author & admin views
│   │   │   │   │   ├── messages.py    # Public responses & internal notes
│   │   │   │   │   ├── ai.py          # AI classification, priority, response drafting
│   │   │   │   │   └── stream.py      # SSE endpoint for real-time ticket events
│   │   │   │   └── api.py             # Router aggregation
│   │   ├── core/
│   │   │   ├── config.py              # Environment variables & Pydantic settings
│   │   │   ├── security.py            # Password hashing & JWT validation
│   │   │   └── database.py            # SQLAlchemy engine & session factory
│   │   ├── models/                    # Database models (SQLAlchemy ORM)
│   │   │   ├── user.py
│   │   │   ├── book.py
│   │   │   ├── ticket.py
│   │   │   ├── ticket_message.py
│   │   │   └── internal_note.py
│   │   ├── schemas/                   # Pydantic request/response validation schemas
│   │   ├── services/                  # Business logic & integrations
│   │   │   ├── ai_service.py          # LLM integration & prompt engineering
│   │   │   ├── mock_ai_service.py     # Deterministic mock provider for offline/tests
│   │   │   └── knowledge_base.py      # Structured KB context retrieval
│   │   └── seeds/
│   │       └── seed_data.py           # Ingestion script for bookleaf_sample_data.json
│   ├── tests/                         # Pytest suite (unit, integration, security)
│   ├── requirements.txt
│   └── Dockerfile
│
└── frontend/                          # Next.js 14+ / React Frontend
    ├── src/
    │   ├── app/
    │   │   ├── (auth)/login/          # Author & admin login
    │   │   ├── author/
    │   │   │   ├── books/             # My Books dashboard
    │   │   │   ├── tickets/           # My Tickets & ticket detail
    │   │   │   └── tickets/new/       # Submit support query form
    │   │   └── admin/
    │   │       ├── queue/             # Unified ticket queue with filters
    │   │       └── tickets/[id]/      # Admin ticket management & AI draft studio
    │   ├── components/                # Modular UI components (Tailwind CSS)
    │   ├── lib/                       # API clients, auth token store, SSE hooks
    │   └── types/                     # TypeScript definitions
    ├── package.json
    └── Dockerfile
```

---

## 7. Next Steps & Approval Gate

With `context.md` and the master dataset preserved inside `padho`:
1. **Approval of Architecture & Step-by-Step Plan:** Review the proposed schema, API contracts, AI fallback strategies, and four-day roadmap.
2. **Phase 1 Execution:** Initializing the repository structure, database models, seed scripts, and core FastAPI backend with automated test coverage.
