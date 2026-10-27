# BookLeaf Author Support & Communication Portal

> **Live Production Deployment:** [https://author-three-sable.vercel.app](https://author-three-sable.vercel.app)  
> *The entire application is live and pre-seeded. Reviewers can test both the Author Portal and the Admin Operations Portal directly in the browser without installing anything locally.*

---

## 1. Quick Test: Live Demo Credentials

The live deployment is pre-seeded with all 10 authors and 18 books from `bookleaf_sample_data.json` alongside an operations administrator account:

| Role | Name | Email | Password | What to Test |
| :--- | :--- | :--- | :--- | :--- |
| **Admin (Staff)** | Operations Desk | `admin@bookleafpub.com` | `Admin123!` | Master Triage Queue, AI Auto-Classification & Urgency Rationale, Response Draft Assistant, Triage Overrides, Private Staff Notes. |
| **Author (Standard)** | Priya Sharma | `priya.sharma@email.com` | `Author123!` | Published catalog (*Whispers of the Ganges*, *The Saffron Diaries*), Royalty breakdown, Inquiry thread. |
| **Author (Pending Royalties)** | Ananya Reddy | `ananya.reddy@email.com` | `Author123!` | *Echoes of the Deccan* has ₹2,546 pending (exceeds ₹1,000 threshold: marked "Eligible for Next Quarter Run"). |
| **Author (Sub-Threshold)** | Kavita Deshmukh | `kavita.deshmukh@email.com` | `Author123!` | *Midnight Musings* has ₹850 pending (under ₹1,000 threshold: rolls over to next quarter). |
| **Author (In Production)** | Vikram Seth | `vikram.seth@email.com` | `Author123!` | *Midnight in Mysore* in Cover Design stage (null publication date, ₹0 royalties, empty distribution list). |

*(All authors `AUTH001` through `AUTH010` from the sample dataset are pre-seeded with the password: `Author123!`)*

---

## 2. Local Setup Guide (Running on Personal Computer)

Follow these simple steps to clone the repository and run the entire stack locally.

### Prerequisites
- **Git** installed ([Download Git](https://git-scm.com/))
- **Python 3.10+** (Python 3.11 or 3.12 recommended, [Download Python](https://www.python.org/))
- **Node.js 18+** and **npm** ([Download Node.js](https://nodejs.org/))

---

### Step 1: Clone the Repository

Open your terminal (PowerShell, Command Prompt, or Bash) and clone the project:

```bash
git clone https://github.com/Ashutxshj/padho.git
cd padho
```

---

### Step 2: Backend Setup (FastAPI & Database)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   # On Windows:
   python -m venv .venv
   .\.venv\Scripts\activate

   # On macOS / Linux:
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your local environment configuration:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env

   # On macOS / Linux / Bash:
   cp .env.example .env
   ```
   *(By default, `.env` is configured to use a lightweight SQLite database `sqlite+aiosqlite:///./bookleaf.db` and the deterministic Mock AI Service for zero-cost, offline testing).*

5. Seed the database with the sample dataset (10 authors, 18 books, and admin user):
   ```bash
   python -m app.seeds.seed_data
   ```

6. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Documentation:** `http://localhost:8000/api/v1/docs`
- **Service Health Check:** `http://localhost:8000/api/health`

---

### Step 3: Frontend Setup (Next.js 14)

Open a **second terminal window** and navigate to the project's `frontend` directory:

1. Navigate to the `frontend` folder:
   ```bash
   cd padho/frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create the frontend environment configuration:
   ```bash
   # On Windows PowerShell:
   Copy-Item .env.example .env.local

   # On macOS / Linux / Bash:
   cp .env.example .env.local
   ```
   *(By default, it points to your local backend: `NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1`)*

4. Start the Next.js development server:
   ```bash
   npm run dev
   ```

- **Frontend Web Portal:** Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

### Alternative: Run with Docker Compose (Single Command)

If you have Docker installed, you can launch the entire stack in one command from the project root:

```bash
docker compose up --build
```
- Web Portal: `http://localhost:3000`
- API & Docs: `http://localhost:8000/api/v1/docs`

---

## 3. Running Automated Tests

A comprehensive test suite of 16 automated tests covers authentication, data isolation, royalty accounting, ticket lifecycle, and AI triage logic:

```bash
cd backend
# With virtual environment activated:
pytest -v
```

### Verified Test Suites (16/16 Passed):
- `tests/test_auth.py`: Health checks, JWT token issuance, password hash validation, current user profile.
- `tests/test_books.py`: Author catalog isolation, admin view-all access, aggregate royalty calculation.
- `tests/test_tickets.py`: Creating inquiries with owned books, rejection of unowned book IDs (`403 Forbidden`), status transitions, messaging.
- `tests/test_ai.py`: 6-category classification, 4-tier priority scoring, knowledge-grounded response drafting.
- `tests/test_security.py`: Cross-author data access rejection, unauthenticated route blocking, internal staff notes confidentiality.

---

## 4. Live Evaluation Walkthrough (2-Minute Test Script)

To experience the dual-portal workflow on the live site ([https://author-three-sable.vercel.app](https://author-three-sable.vercel.app)):

1. **Step 1 (Author Portal):**
   - Go to [https://author-three-sable.vercel.app/login](https://author-three-sable.vercel.app/login).
   - Click the quick button **"Ananya Reddy (₹2,546 Pending)"** to log in.
   - On the **Catalog & Royalties** page, review the asymmetric balance sheet: note that pending royalties (₹2,546) exceed the ₹1,000 threshold and show "Eligible for Next Quarter Run".
   - Click **"Submit Inquiry"**, select *Echoes of the Deccan*, enter subject *"Inquiry on Q3 Royalty Payout Schedule"*, and submit.

2. **Step 2 (Admin Operations Portal):**
   - Log out, then click **"Operations Admin"** (`admin@bookleafpub.com` / `Admin123!`).
   - On the **Operations Triage Queue**, observe the new inquiry automatically categorized as `Royalty & Payments` with `High` priority.
   - Click into the inquiry.
   - In the **Response Draft Assistant**, click **"Generate Draft"**. The engine synthesizes a personalized reply citing BookLeaf's 80/20 net profit split, quarterly payout cycle, and the exact ₹2,546 balance.
   - Click **"Insert Draft Into Reply Composer"**, edit the text, and click **"Send Public Reply"**.
   - Add a private note in the **Internal Notes** box (*"Verified with finance desk, scheduled for batch run"*).

3. **Step 3 (Real-Time Live Updates):**
   - Open a separate browser window as author Ananya Reddy: the admin response appears dynamically on her screen via **Server-Sent Events (SSE)** without needing a page refresh, while internal staff notes remain completely private.

---

## 5. Technology Stack & Key Architectural Highlights

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router) + Tailwind CSS** | Editorial publication design system (`Source_Sans_3` font, `#fbfbf9` warm paper palette, sky-light elevation model, skeleton loaders, `/terms` and `/privacy` compliance pages). |
| **Backend** | **FastAPI (Python 3.12)** | Asynchronous ASGI execution, strict Pydantic v2 schemas, automated OpenAPI/Swagger documentation, and RFC 7807 error formatting. |
| **Database** | **SQLAlchemy 2.0 (Async) + PostgreSQL / SQLite** | Multi-environment compatibility: Supabase managed PostgreSQL with connection pooler (`statement_cache_size=0`) in production and SQLite for local development. |
| **Real-Time** | **Server-Sent Events (SSE)** | Dynamic real-time event broadcasting (`/api/v1/stream/tickets`) with keep-alive heartbeat and polling fallback. |
| **AI Layer** | **Pluggable `AIService` Interface** | Live LLM integration (Google Gemini / OpenAI / Claude) with an automatic offline deterministic mock fallback ensuring 100% test reliability. |

---

## 6. Assumptions & Implementation Notes

1. **Royalty Disbursement:** The portal calculates royalties on an 80/20 net profit split and tracks threshold eligibility (₹1,000 minimum); payouts are scheduled for batch accounting runs within 45 days post-quarter.
2. **Production Milestones:** Manuscript stages (*Cover Design*, *Typesetting*, *Proofreading*) are displayed transparently to authors; typesetting and design files are edited in specialized publishing software outside the web browser.
3. **AI Fallback Resilience:** The application is architected so that tickets are committed to the database *before* AI processing begins. If an external AI provider times out or is rate-limited, the system assigns sensible defaults (`General Inquiry`, `Medium` priority) and logs a fallback status, guaranteeing zero ticket loss.
