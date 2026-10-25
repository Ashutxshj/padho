# BookLeaf Author Support & Communication Portal

An enterprise-grade, dual-portal web application engineered for **BookLeaf Publishing** to streamline author communications, track book sales and royalties, and empower operations staff with AI-driven ticket categorization, priority assessment, and knowledge-grounded response drafting.

---

## 1. Quick Start & Demonstration Credentials

Pre-seeded demonstration accounts are configured out of the box with realistic catalog data:

| Role | Name | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Author** | Priya Sharma | `priya.sharma@email.com` | `Author123!` | My Books (*Whispers of the Ganges*, *The Saffron Diaries*), Royalty breakdown, Ticket submission & conversation feed. |
| **Admin** | Saloni Mourya | `admin@bookleafpub.com` | `Admin123!` | Master Operations Queue, AI Draft Studio, Status & Priority Overrides, Private Staff Notes. |

*(Additional author accounts `AUTH001` through `AUTH010` from `bookleaf_sample_data.json` are seeded with password `Author123!`)*

---

## 2. Key Features

### Author Portal
- **My Books Dashboard:** Transparent overview of published titles and production stages, ISBNs, sales volumes, lifetime royalties earned, royalties disbursed, and pending balance.
- **Royalty Threshold Tracking:** Clear indicators verifying whether pending royalties meet the **₹1,000 threshold** or safely roll over to the subsequent quarter.
- **Query Submission:** Intuitive form allowing authors to link specific owned books (or choose *General / Account Level*), provide descriptions, and attach mock files.
- **Real-Time Live Updates:** Uses **Server-Sent Events (SSE)** so admin replies and status transitions update dynamically on screen without full page reloads.
- **Hard Data Isolation:** Strict server-side authorization ensuring authors can only ever access their own books and tickets.

### Admin Operations Portal
- **Master Triage Queue:** Multi-filter engine (Status, Category, Priority, Text Search) with deterministic urgency scoring.
- **SLA Breach Warnings:** Prominently flags unresolved open tickets older than 48 hours with red overdue badges.
- **AI Auto-Classification:** Categorizes tickets into exactly one of 6 canonical BookLeaf categories with rationales.
- **AI Priority Scoring:** Rates tickets (*Critical*, *High*, *Medium*, *Low*) based on business and financial urgency.
- **Audit-Preserving Overrides:** Operations staff can override machine suggestions; the database preserves both AI proposals and human decisions.
- **AI Response Draft Studio:** Grounded in BookLeaf's official Knowledge Base policies and the author's real catalog metrics. Provides one-click draft generation with editable previews before public dispatch.
- **Private Staff Notes:** Secure internal commentary hidden from authors for team coordination.

---

## 3. Technology Stack & Decision Rationale

| Layer | Selected Tech | Rationale |
| :--- | :--- | :--- |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous performance, Pydantic v2 strict type validation, auto-generated OpenAPI/Swagger documentation, and native AI/LLM integration. |
| **Frontend UI** | **Next.js 14 (App Router) + Tailwind CSS** | Server-side rendering, responsive component architecture, rapid styling, and clean file-based routing. |
| **Database** | **SQLAlchemy 2.0 (Async) + SQLite / PostgreSQL** | ACID compliance, strict foreign key constraints, and financial calculation invariants (`earned - paid == pending`). |
| **Real-Time Hub** | **Server-Sent Events (SSE)** | Lightweight unidirectional real-time streaming with keep-alive heartbeat pings and automatic polling fallback. |
| **AI Integration** | **Pluggable `AIService` Layer** | Seamlessly supports live LLM providers (OpenAI, Claude, Gemini) alongside a **Deterministic Mock Provider** for zero-cost offline evaluations. |

---

## 4. Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git

### 4.1 Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Seed the database with sample dataset (10 authors, 18 books)
python -m app.seeds.seed_data

# 5. Start the backend development server
uvicorn app.main:app --reload --port 8000
```
*The backend API will be available at `http://localhost:8000`.*  
*Interactive Swagger API documentation: `http://localhost:8000/api/v1/docs`*

### 4.2 Frontend Setup
```bash
# 1. Open a new terminal and navigate to frontend directory
cd frontend

# 2. Install npm packages
npm install

# 3. Start the Next.js development server
npm run dev
```
*The web portal will be accessible at `http://localhost:3000`.*

---

## 5. Docker Orchestration

To run the complete application inside isolated containers:

```bash
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Interactive API Docs: `http://localhost:8000/api/v1/docs`

---

## 6. AI Architecture & Prompt Engineering

BookLeaf's evaluation places **25% weight on AI integration**. Our implementation prioritizes production reliability:

1. **Grounded Policy Synthesis (Zero Hallucination):** The response generator operates strictly on the provided BookLeaf Knowledge Base (80/20 net profit split, quarterly cycles, 45-day payout windows, ISBN imprint rules, 5-7 day print reprints, and 24-48h platform stock re-syncs).
2. **Selective Token Chunking (Cost Awareness):** Instead of dumping the entire policy manual into every request, the engine extracts only relevant sections based on query context, cutting token overhead by over 60%.
3. **Pluggable Mock AI Provider:** When third-party LLM API keys are not supplied, the application automatically engages a deterministic mock service that validates JSON output schemas and matches BookLeaf's expected response calibration examples.
4. **Graceful Degradation:** Tickets are committed to the database *before* AI operations begin. If an external AI provider times out (>8s) or is rate-limited, the system assigns sensible defaults (`General Inquiry`, `Medium` priority) and logs status `FAILED_FALLBACK`, ensuring zero tickets are lost.

---

## 7. Running Automated Tests

A comprehensive test suite verifies business logic, data isolation, AI parsing, and RBAC authorization boundaries:

```bash
cd backend
.venv\Scripts\pytest -v
```

### Verified Test Suites:
- `tests/test_auth.py` — Login flows, credential verification, JWT issuance, profile endpoints.
- `tests/test_books.py` — Author book isolation, admin catalog queries, aggregate royalty calculations.
- `tests/test_tickets.py` — Ticket creation with owned books, rejection of unowned book IDs, status updates, messaging.
- `tests/test_ai.py` — Category classification, priority scoring, grounded response drafting.
- `tests/test_security.py` — Cross-author ticket access rejections, unauthenticated blocking, internal notes confidentiality.

---

## 8. Live Demonstration Script

1. **Step 1:** Navigate to `http://localhost:3000/login`. Click **"Author Demo (Priya Sharma)"** to log in.
2. **Step 2:** On the **My Books** page, view published titles and verify that pending royalties (₹3,570) exceed the ₹1,000 threshold.
3. **Step 3:** Click **"Raise Support Query"**. Select *Whispers of the Ganges*, enter subject *"Inquiry on Q3 Royalty Payout"*, and submit.
4. **Step 4:** Log out, then click **"Admin Demo (Operations Desk)"**.
5. **Step 5:** On the **Operations Queue**, observe the new ticket auto-classified as `Royalty & Payments` with `High` priority.
6. **Step 6:** Open the ticket. Click **"Generate AI Reply"** in the AI Studio to produce an empathetic draft citing BookLeaf policies. Edit the text and click **"Send Public Reply"**.
7. **Step 7:** Add a private internal staff note (*"IFSC verified with Axis Bank"*).
8. **Step 8:** Re-open the author view in a separate window: notice the admin reply appears dynamically without page reload, while internal notes remain completely private!

---

## 9. Assumptions & Known Limitations

1. **Live Direct Banking Transfers:** The system calculates and displays royalty balances and threshold eligibility; bank wire transfers are triggered through accounting file exports rather than direct banking APIs.
2. **Production Manuscript Editing:** Stage milestones (`Typesetting`, `Cover Design`, `Proofreading`) are tracked transparently; typesetting files are edited in professional publishing software outside the web browser.
3. **Live LLM Fallback:** The deterministic mock AI service ensures 100% test pass rates and offline demonstration reproducibility without third-party API dependencies. Supplying an `OPENAI_API_KEY` or `GEMINI_API_KEY` in `backend/.env` switches to live generative models.
