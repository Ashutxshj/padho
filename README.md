# BookLeaf Author Support & Communication Portal

An enterprise-grade, dual-portal web application engineered for **BookLeaf Publishing** to streamline author communications, track book sales and royalties, and empower operations staff with AI-driven ticket categorization, priority assessment, and knowledge-grounded response drafting.

Built with an editorial publication design system complying with the **Erik D. Kennedy UI Design Rules** and the **Anti "AI-Generated Look" Standards**.

---

## 1. Quick Start & Demonstration Credentials

Pre-seeded demonstration accounts are configured out of the box with realistic catalog data:

| Role | Name | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Operations Staff | `admin@bookleafpub.com` | `Admin123!` | Master Operations Queue, AI Draft Studio, Status & Priority Overrides, Private Staff Notes. |
| **Author** | Priya Sharma | `priya.sharma@email.com` | `Author123!` | Standard author catalog (*Whispers of the Ganges*, *The Saffron Diaries*), Royalty breakdown, Ticket conversation feed. |
| **Author** | Ananya Reddy | `ananya.reddy@email.com` | `Author123!` | Pending royalties test (*Echoes of the Deccan*, ₹2,546 pending, payout date null). |
| **Author** | Kavita Deshmukh | `kavita.deshmukh@email.com` | `Author123!` | Sub-threshold edge case (*Midnight Musings*, ₹850 pending: rolls over to next quarter under ₹1,000 threshold). |
| **Author** | Vikram Seth | `vikram.seth@email.com` | `Author123!` | Production pipeline edge case (*Midnight in Mysore*, Cover Design stage, null dates and ₹0 royalties). |

*(All authors `AUTH001` through `AUTH010` from `bookleaf_sample_data.json` are seeded with password `Author123!`)*

---

## 2. Key Features

### Author Portal
- **Catalog & Royalties Dashboard (`/author/books`):** Transparent overview of published titles and production stages, ISBNs, sales volumes, lifetime royalties earned, royalties disbursed, and pending balance.
- **Asymmetric Balance Sheet:** Structured financial card presenting net profit breakdowns (80% net profit formula: MRP minus printing cost, platform commission, and shipping) alongside payout threshold status.
- **Royalty Threshold Tracking:** Clear indicators verifying whether pending royalties meet the **₹1,000 threshold** or safely roll over to the subsequent quarter.
- **Inquiry Submission (`/author/tickets/new`):** Intuitive form allowing authors to link specific owned books (or choose *General or Account Level*), provide descriptions, and receive immediate tracking references.
- **Real-Time Live Updates (`/author/tickets/[id]`):** Uses **Server-Sent Events (SSE)** so admin replies and status transitions update dynamically on screen without full page reloads.
- **Hard Data Isolation:** Strict server-side authorization ensuring authors can only ever access their own books and tickets.

### Admin Operations Portal
- **Master Triage Queue (`/admin/queue`):** Multi-filter engine (Status, Category, Priority, Text Search) with deterministic urgency scoring.
- **SLA Breach Warnings:** Prominently flags unresolved open tickets older than 48 hours with overdue badges.
- **AI Auto-Classification:** Categorizes tickets into exactly one of 6 canonical BookLeaf categories with rationales.
- **AI Priority Scoring:** Rates tickets (*Critical*, *High*, *Medium*, *Low*) based on business and financial urgency.
- **Audit-Preserving Overrides:** Operations staff can override machine suggestions; the database preserves both AI proposals and human decisions.
- **Response Draft Assistant Studio:** Grounded in BookLeaf's official Knowledge Base policies and the author's real catalog metrics. Provides one-click draft generation with editable previews before public dispatch.
- **Private Staff Notes:** Secure internal commentary hidden from authors for team coordination.

---

## 3. Editorial UI Design System & Anti-AI Standards

The frontend was engineered to avoid generic AI-template aesthetics by adhering to strict human design principles:

1. **Editorial Typography:** Replaced generic AI fonts (Inter, Geist, Space Grotesk) with **`Source_Sans_3`** (humanist publication typeface via Google Fonts) with tight negative tracking on headings.
2. **Warm Tactile Palette:** Replaced harsh `#fff` with warm, bookish paper tones (`#fbfbf9`), eliminating loud multi-stop gradients and sterile purple/black startup colors.
3. **Sky-Light Elevation Model:** Raised elements feature subtle bottom-only shadows (`0 1px 2px rgba(0,0,0,0.03)`), while interactive inputs use subtle top-insets (`inset 0 1px 2px rgba(0,0,0,0.04)`).
4. **Anti-AI Ornament Diet:**
   - Zero sparkle icons (✨) near AI features; replaced with dignified "Response Draft Assistant".
   - Zero emojis in headings, lists, or UI copy.
   - Zero checkmark bullets (`✓`) or bento box card mosaics.
   - Zero em dashes ("—") in copy; restructured sentences with clear clauses.
5. **Product Completeness:**
   - Formal **Terms of Service** page at [`/terms`](file:///c:/Users/Ashut/OneDrive/Desktop/Projects/padho/frontend/src/app/terms/page.tsx).
   - Formal **Privacy Policy** page at [`/privacy`](file:///c:/Users/Ashut/OneDrive/Desktop/Projects/padho/frontend/src/app/privacy/page.tsx).
   - **Skeleton Loaders:** Replaced all raw spinners with structured `Skeleton`, `CardSkeleton`, and `TableSkeleton` states to eliminate layout jumps.

---

## 4. Production Cloud Architecture

```
+-----------------------------------------------------------------------------------------+
|                                    VERCEL EDGE TIER                                     |
|                                Next.js 14 (App Router)                                  |
|   - 11 Statically & Dynamically Compiled Routes                                         |
|   - Environment: NEXT_PUBLIC_API_URL=https://<render-backend>/api/v1                    |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             | HTTPS / JSON REST API & SSE EventStream
                                             v
+--------------------------------------------+--------------------------------------------+
|                                    RENDER WEB SERVICE                                   |
|                                  FastAPI (Python 3.12)                                  |
|   - Uvicorn Asynchronous ASGI Server                                                    |
|   - Server-Sent Events Broadcaster (/api/v1/stream/tickets)                             |
|   - Pluggable Gemini / OpenAI / Mock AI Service Layer                                   |
+--------------------------------------------+--------------------------------------------+
                                             |
                                             | AsyncPG TLS Connection (IPv4 Pooler)
                                             | Port 5432 / 6543, statement_cache_size=0
                                             v
+-----------------------------------------------------------------------------------------+
|                                SUPABASE POSTGRESQL POOLER                               |
|   - Supavisor Connection Pooler (aws-0-[region].pooler.supabase.com)                     |
|   - Permissive SSLContext (check_hostname=False, verify_mode=CERT_NONE)                 |
|   - Pre-seeded tables: Users, Books, Tickets, Messages, InternalNotes, AILogs           |
+-----------------------------------------------------------------------------------------+
```

---

## 5. Technology Stack & Decision Rationale

| Layer | Selected Tech | Rationale |
| :--- | :--- | :--- |
| **Backend API** | **FastAPI (Python 3.12)** | Asynchronous performance, Pydantic v2 strict type validation, auto-generated OpenAPI/Swagger documentation, and native AI/LLM integration. |
| **Frontend UI** | **Next.js 14 (App Router) + Tailwind CSS** | Server-side rendering, responsive component architecture, rapid styling, and clean file-based routing. |
| **Database** | **SQLAlchemy 2.0 (Async) + PostgreSQL / SQLite** | ACID compliance, strict foreign key constraints, and financial calculation invariants (`earned - paid == pending`). Compatible with Supabase pooler and local SQLite. |
| **Real-Time Hub** | **Server-Sent Events (SSE)** | Lightweight unidirectional real-time streaming with keep-alive heartbeat pings and automatic polling fallback. |
| **AI Integration** | **Pluggable `AIService` Layer** | Seamlessly supports live LLM providers (Google Gemini, OpenAI, Claude) alongside a **Deterministic Mock Provider** for zero-cost offline evaluations. |

---

## 6. Local Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git

### 6.1 Backend Setup
```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
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

### 6.2 Frontend Setup
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

## 7. Automated Testing Suite

A comprehensive test suite verifies business logic, data isolation, AI parsing, and RBAC authorization boundaries:

```bash
cd backend
.\.venv\Scripts\pytest -v
```

### Verified Test Suites (16/16 Passed):
- `tests/test_auth.py`: Login flows, credential verification, JWT issuance, profile endpoints.
- `tests/test_books.py`: Author book isolation, admin catalog queries, aggregate royalty calculations.
- `tests/test_tickets.py`: Ticket creation with owned books, rejection of unowned book IDs, status updates, messaging.
- `tests/test_ai.py`: Category classification, priority scoring, grounded response drafting.
- `tests/test_security.py`: Cross-author ticket access rejections, unauthenticated blocking, internal notes confidentiality.

---

## 8. Live Demonstration Script

1. **Step 1:** Navigate to `/login`. Click **"Ananya Reddy (₹2,546 Pending)"** to log in.
2. **Step 2:** On the **Author Catalog & Royalties** page, review the asymmetric balance sheet and verify that pending royalties (₹2,546) exceed the ₹1,000 threshold and show "Eligible for Next Quarter Run".
3. **Step 3:** Click **"Submit Inquiry"**. Select *Echoes of the Deccan*, enter subject *"Inquiry on Q3 Royalty Payout Schedule"*, and submit.
4. **Step 4:** Log out, then click **"Operations Admin"** (`admin@bookleafpub.com` / `Admin123!`).
5. **Step 5:** On the **Operations Triage Queue**, observe the new ticket auto-classified as `Royalty & Payments` with `High` priority.
6. **Step 6:** Open the ticket detail cockpit. In the **Response Draft Assistant**, click **"Generate Draft"** to produce an empathetic draft citing BookLeaf policies. Click **"Insert Draft Into Reply Composer"**, edit the text, and click **"Send Public Reply"**.
7. **Step 7:** Add a private internal staff note (*"Bank account verified with Axis Bank, scheduled for batch run"*).
8. **Step 8:** Re-open the author view in a separate window: notice the admin reply appears dynamically via real-time SSE without page reload, while internal notes remain completely hidden.
