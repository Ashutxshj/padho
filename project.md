# BookLeaf Author Support & Communication Portal
# Project Scope, Requirements & SDLC Framework (`project.md`)

---

## 1. Executive Summary & Purpose

The **BookLeaf Author Support & Communication Portal** is an enterprise-grade web application engineered to solve critical operational bottlenecks for BookLeaf Publishing—a high-volume self-publishing house processing 1,200+ monthly books across an active catalog of 22,000+ titles.

The application bridges the communication divide between self-publishing authors and BookLeaf's operations team by providing:
1. **A transparent Author Portal** for tracking book production milestones, sales volumes, and quarterly royalty earnings, alongside an interactive support ticket system with real-time updates.
2. **An AI-powered Admin Operations Portal** that auto-classifies tickets, calculates urgency scores, drafts empathetic, knowledge-grounded responses, and manages internal workflows with complete human oversight.

---

## 2. Project Scope

To ensure delivery within the aggressive 4-day timeframe while maintaining high engineering quality, the project scope is divided into explicit boundaries:

```
+---------------------------------------------------------------------------------------------------------+
|                                           PROJECT BOUNDARIES                                            |
|                                                                                                         |
|   +---------------------------------------------------+  +-------------------------------------------+  |
|   |                  IN-SCOPE                         |  |               OUT-OF-SCOPE                |  |
|   |  - Author & Admin Authentication (JWT + RBAC)     |  |  - Direct banking wire transfer execution |  |
|   |  - Author Books Catalog & Royalty Breakdown       |  |  - Interactive manuscript text editing    |  |
|   |  - Support Ticket Submission & Book Linking       |  |  - Native mobile application builds (iOS) |  |
|   |  - Real-Time Updates via Server-Sent Events (SSE) |  |  - Heavy microservices (Kafka / Celery)   |  |
|   |  - Operational Ticket Queue with Multi-Filtering  |  |  - Payment gateway checkout processing    |  |
|   |  - AI Auto-Classification (6 Specific Categories) |  |  - Live production ISBN registry calls   |  |
|   |  - AI Priority Scoring (4 Specific Tiers)         |  +-------------------------------------------+  |
|   |  - AI Response Drafting Grounded in Knowledge Base|                                                 |
|   |  - Private Internal Staff Notes (Author-isolated) |                                                 |
|   |  - Pluggable Mock AI Provider for Offline Tests   |                                                 |
|   |  - Full Ingestion of `bookleaf_sample_data.json`  |                                                 |
|   |  - Automated Test Suite & Docker Orchestration    |                                                 |
|   +---------------------------------------------------+                                                 |
+---------------------------------------------------------------------------------------------------------+
```

### 2.1 In-Scope Deliverables
- **Author Portal:**
  - Secure email/password login and session management.
  - "My Books" dashboard presenting title, ISBN, genre, status, MRP, sales volume, lifetime royalties earned, royalties paid, and pending balance.
  - Ticket submission form with owned-book selector, "General / Account Level" option, subject, description, and client-side attachment interface.
  - "My Tickets" feed displaying live status, full conversation history, and real-time updates without full page reloads.
- **Admin Operations Portal:**
  - Unified operational queue listing tickets across all authors with search, pagination, and multi-criteria filtering (status, category, priority, date).
  - Deterministic urgency sorting prioritizing critical issues and overdue unresolved tickets (>48 hours).
  - AI Auto-Classification into 6 business categories with full manual override.
  - AI Priority Scoring (`Critical`, `High`, `Medium`, `Low`) with rationale and manual override.
  - Knowledge-Grounded AI Response Draft Studio allowing staff review, personalization, and dispatch.
  - Private internal staff notes feed hidden from author visibility.
- **API & Backend Layer:**
  - Clean RESTful API adhering to HTTP standards and RFC 7807 error formats.
  - Role-Based Access Control (RBAC) middleware deriving identity from server-verified JWT claims.
  - Relational schema enforcing foreign keys, financial consistency invariants, and query indexing.
  - Interactive OpenAPI/Swagger documentation.
- **Resilience & Testing:**
  - Pluggable AI service supporting live LLM providers and an offline deterministic mock provider.
  - Graceful degradation ensuring ticket persistence even if upstream AI providers fail.
  - Pytest automated test suite covering unit logic, API integration, and security authorization boundaries.
  - Multi-container Docker Compose deployment.

### 2.2 Out-of-Scope Items (Guarding Timeline & Simplicity)
- **Direct Banking / Wire Transfer Gateways:** The portal computes, tracks, and displays royalty figures, but does not execute direct bank-to-bank NEFT/RTGS transfers.
- **WYSIWYG Manuscript Editor:** Book formatting and typesetting occur through BookLeaf's production tools; this portal tracks stage progression (`Typesetting`, `Cover Design`, `Proofreading`) without embedding an in-browser typesetting tool.
- **Overengineered Distributed Infrastructure:** Avoiding unnecessary Redis clusters, Kubernetes, or Celery task workers where asynchronous Python capabilities and FastAPI background tasks cleanly fulfill requirements.

---

## 3. Comprehensive Requirements Catalog

### 3.1 Functional Requirements (FR)

| Req ID | Domain | Requirement Statement | Verification Method |
| :--- | :--- | :--- | :--- |
| **FR-01** | Auth | System must authenticate authors and admins via email and hashed passwords. | Pytest integration test + manual login |
| **FR-02** | Auth | Each author must access only their own books and tickets. Identity must be extracted from the verified server token. | Security test attempting cross-author access |
| **FR-03** | Books | System must display all books belonging to the authenticated author with complete sales and royalty breakdowns. | API test against sample dataset |
| **FR-04** | Books | Financial invariant must hold: $\text{Royalty Pending} = \text{Total Royalty Earned} - \text{Royalty Paid}$. | Unit test asserting invariant across dataset |
| **FR-05** | Tickets | Authors must be able to submit tickets linking to an owned book or designated as "General / Account Level". | API test creating ticket with valid book ID |
| **FR-06** | Tickets | Server must reject ticket submissions attempting to link a `book_id` owned by another author (`403 Forbidden`). | Security authorization test |
| **FR-07** | Real-Time | Ticket updates and admin responses must reflect in the author view in real time (via SSE) without page refresh. | SSE stream client listener test |
| **FR-08** | Queue | Admin dashboard must list all tickets, filterable by status, category, priority, and date, sorted by urgency formula. | Queue query filter tests |
| **FR-09** | AI Classify | Every new ticket must be auto-classified into 1 of the 6 canonical categories with reasoning. | AI output schema validation test |
| **FR-10** | AI Priority | Every new ticket must receive an AI-generated priority (`Critical`, `High`, `Medium`, `Low`) with business rationale. | AI priority scoring test |
| **FR-11** | Overrides | Admins must be able to override AI category and priority; system must preserve both original AI and human choices. | Ticket update API test |
| **FR-12** | AI Draft | System must generate empathetic response drafts grounded in the official BookLeaf Knowledge Base. | Draft generator test with policy citation |
| **FR-13** | Notes | Admins must be able to add private internal notes to tickets. Notes must never be visible to authors. | Security isolation test |

### 3.2 Non-Functional Requirements (NFR)

| NFR ID | Category | Requirement Statement |
| :--- | :--- | :--- |
| **NFR-01** | **Security** | Passwords must be hashed using bcrypt (work factor 12). JWT tokens must carry expiration and cryptographic signatures. |
| **NFR-02** | **Data Isolation** | Multi-tenant tenant boundary enforced at the database layer; author routes query only where `author_id == current_user.id`. |
| **NFR-03** | **Fault Tolerance** | Tickets must be committed to the database *before* AI processing. AI failures or timeouts (>8s) must degrade gracefully to defaults without crashing or losing data. |
| **NFR-04** | **Cost Efficiency** | AI calls must use selective Knowledge Base chunking rather than full document dumps, minimizing token consumption. |
| **NFR-05** | **Offline Testability**| Application must fully boot, seed, and pass 100% of tests without requiring external internet access or live AI API keys via `MockAIService`. |
| **NFR-06** | **Performance** | Ticket queue queries must execute in under 50ms utilizing database indexes on `status`, `category`, `priority`, and `author_id`. |
| **NFR-07** | **Standardization**| All API responses must follow REST conventions with standard HTTP status codes and RFC 7807 error envelopes. |

---

## 4. Software Development Life Cycle (SDLC) Framework

The project is governed by a **structured, iterative Agile-Engineering SDLC** tailored for rapid delivery with verification gates at every phase:

```mermaid
flowchart TD
    S1[Stage 1: Requirements & Feasibility] --> S2[Stage 2: Architecture & System Design]
    S2 --> S3[Stage 3: Data Modeling & Seed Ingestion]
    S3 --> S4[Stage 4: Backend API & Security Implementation]
    S4 --> S5[Stage 5: AI Engine & Fallback Layer]
    S5 --> S6[Stage 6: Real-Time Event Hub (SSE)]
    S6 --> S7[Stage 7: Frontend Portal Development]
    S7 --> S8[Stage 8: Testing, Security Audit & Verification]
    S8 --> S9[Stage 9: Containerization & Live Deployment]
    S9 --> S10[Stage 10: Review, Documentation & Release]
```

---

### Stage 1: Requirements Gathering & Feasibility Analysis
- **Objectives:** Inspect all assignment documents (`BookLeaf_Technical_Assignment_1.pdf`) and the master sample dataset (`bookleaf_sample_data.json`).
- **Key Activities:**
  - Verify dataset structure: 10 authors, 18 books, edge cases (books in production, null dates, sub-threshold balances).
  - Extract the official BookLeaf Knowledge Base policies (80/20 split, ₹1,000 threshold, quarterly payout schedule, ISBN rules, print defect reprints).
  - Document evaluation weightings (AI 25%, Architecture 25%, API 15%, Functionality 15%, Product 10%, Docs 10%).
- **Exit Gate Artifact:** [`context.md`](file:///c:/Users/Ashut/OneDrive/Desktop/Projects/padho/context.md) authored and committed.

---

### Stage 2: Architecture & High/Low-Level System Design
- **Objectives:** Establish system topology, component interactions, database schemas, REST status code registry, and AI prompt contracts.
- **Key Activities:**
  - Design decoupled 4-tier architecture (Next.js, FastAPI, PostgreSQL/SQLite, Pluggable AI Service).
  - Formulate deterministic queue urgency formula ($\text{Urgency Score} = W_{\text{priority}} \times 1000 + \text{Age In Hours} \times 2$).
  - Define relational schema DDL with strict foreign keys, cascade rules, and query indexes.
  - Specify all 12 API endpoints with request/response schemas, error handling, and recovery rules.
  - Document human-readable walkthroughs and interview demonstration scripts.
- **Exit Gate Artifacts:**
  - [`architecture.md`](file:///c:/Users/Ashut/OneDrive/Desktop/Projects/padho/architecture.md)
  - [`plan.md`](file:///c:/Users/Ashut/OneDrive/Desktop/Projects/padho/plan.md)
  - [`layout.md`](file:///c:/Users/Ashut/OneDrive/Desktop/Projects/padho/layout.md)
  - [`process.md`](file:///c:/Users/Ashut/OneDrive/Desktop/Projects/padho/process.md)

---

### Stage 3: Data Modeling, Migrations & Sample Ingestion
- **Objectives:** Construct persistent database entities and seed realistic operational data.
- **Key Activities:**
  - Implement SQLAlchemy 2.0 ORM models: `User`, `Book`, `Ticket`, `TicketMessage`, `InternalNote`, `AILog`.
  - Configure Alembic migration environment and generate baseline schema migrations.
  - Author automated seed script `seed_data.py` ingesting all 10 authors and 18 books from `bookleaf_sample_data.json`.
  - Seed pre-configured demo credentials:
    - Author: `priya.sharma@email.com` / `Author123!`
    - Admin: `admin@bookleafpub.com` / `Admin123!`
- **Exit Gate Criteria:** `alembic upgrade head` and `python -m app.seeds.seed_data` execute cleanly with zero database integrity violations.

---

### Stage 4: Backend API Development & Security Middleware
- **Objectives:** Implement core business logic, authentication, and author/admin authorization boundaries.
- **Key Activities:**
  - Implement bcrypt password hashing and cryptographic JWT token minting/verification.
  - Build dependency injection security guards: `get_current_user`, `require_author`, `require_admin`.
  - Implement `/api/v1/auth` endpoints (`/login`, `/me`, `/logout`).
  - Implement `/api/v1/books` endpoints (author-scoped book catalog, financial summaries).
  - Implement `/api/v1/tickets` endpoints (ticket creation, status transitions, admin queue filtering).
  - Implement messaging and internal notes endpoints with strict privacy isolation.
- **Exit Gate Criteria:** Automated API integration tests pass 100%; unauthorized requests return `401 Unauthorized` or `403 Forbidden`.

---

### Stage 5: Applied AI Service & Resilience Layer
- **Objectives:** Build structured, resilient AI capabilities grounded in BookLeaf's Knowledge Base.
- **Key Activities:**
  - Define Pydantic structured output models for classification, priority scoring, and response drafting.
  - Implement selective Knowledge Base retrieval chunking to optimize token usage.
  - Build `MockAIService` providing deterministic offline simulation for tests and zero-cost local runs.
  - Build `LiveAIService` integrating with OpenAI (`gpt-4o-mini`), Claude, or Gemini.
  - Wrap AI operations in an 8-second timeout with fallback to `General Inquiry` / `Medium` priority.
- **Exit Gate Criteria:** AI outputs strictly adhere to schemas; simulated AI outage allows ticket submission to succeed without data loss.

---

### Stage 6: Real-Time Event Hub (Server-Sent Events)
- **Objectives:** Provide real-time event streaming so authors and admins receive updates without manual page refreshes.
- **Key Activities:**
  - Implement asynchronous in-memory event broadcaster in FastAPI.
  - Create `/api/v1/stream/tickets` endpoint supporting `text/event-stream`.
  - Filter events on dispatch: authors receive only their own ticket events; admins receive global queue events.
  - Add 15-second heartbeat pings to keep connections active across proxies.
  - Implement client-side connection hook with exponential backoff and seamless fallback to 8-second polling.
- **Exit Gate Criteria:** Posting a message immediately emits an SSE event received by an active stream subscriber.

---

### Stage 7: Frontend Portal Development
- **Objectives:** Construct clean, accessible, and responsive user interfaces for both portals.
- **Key Activities:**
  - Initialize Next.js 14+ (App Router) with TypeScript and Tailwind CSS.
  - Build shared UI components (stat cards, status badges, priority badges, alert banners, modal dialogs).
  - Author Portal views:
    - `/login`: Form with quick-fill demo buttons.
    - `/author/books`: Books catalog with sales volumes and pending royalty highlights.
    - `/author/tickets/new`: Ticket form with owned-book dropdown and validation.
    - `/author/tickets/[id]`: Real-time ticket thread.
  - Admin Portal views:
    - `/admin/queue`: Master queue with multi-filtering, search, and urgency badges.
    - `/admin/tickets/[id]`: Management cockpit with AI suggestions, overrides, AI Draft Studio, and internal notes.
- **Exit Gate Criteria:** Both portals operate seamlessly, interacting with the backend API and reflecting live updates.

---

### Stage 8: Quality Assurance, Security Audits & Testing
- **Objectives:** Validate all functional requirements, security boundaries, and edge cases.
- **Key Activities:**
  - **Unit Tests:** Input validation, royalty invariant calculations, Pydantic schema validation.
  - **Integration Tests:** Authentication, ticket lifecycle, admin queue filtering, messaging.
  - **Security Tests:** Cross-author data access attempts, author accessing admin endpoints, internal note leakage prevention, prompt injection resilience.
  - **End-to-End Tests:** Complete workflow from author ticket submission to AI categorization, admin drafting, reply dispatch, and real-time reflection.
- **Exit Gate Criteria:** `pytest` reports 100% test pass rate across unit, integration, and security suites.

---

### Stage 9: Containerization, Deployment & Live Demo
- **Objectives:** Package the complete stack for reproducible local execution and public evaluation.
- **Key Activities:**
  - Author production multi-stage `Dockerfile` for backend and frontend.
  - Configure `docker-compose.yml` linking Postgres, FastAPI backend, and Next.js frontend with health checks.
  - Deploy application to a publicly accessible host (e.g., Railway / Render / Vercel).
  - Pre-seed deployed database with sample dataset.
  - Verify live demo URLs and test accounts.
- **Exit Gate Criteria:** `docker compose up --build` brings up entire application locally; live URL responds with working pre-seeded portals.

---

### Stage 10: Review, Documentation & Release
- **Objectives:** Prepare final evaluation documentation adhering to assignment confidentiality.
- **Key Activities:**
  - Finalize `README.md` with setup instructions, architectural rationale, AI cost analysis, and known limitations.
  - Prepare 1-Page Architectural & Approach Write-Up.
  - Verify commit history cleanliness and absence of hardcoded secrets or API keys.
  - Ensure repository privacy and prepare collaborator access.
- **Exit Gate Criteria:** Complete submission package ready for evaluation and technical interview.

---

## 5. Roles & Responsibilities Matrix (RACI)

| SDLC Phase / Milestone | Architect | Full-Stack Dev | AI Engineer | QA & Security | Project Manager |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Requirements Analysis** | **A** | **C** | **C** | **C** | **R** |
| **System Architecture & HLD** | **R** | **C** | **C** | **C** | **A** |
| **Database Modeling & Seeding** | **C** | **R** | **I** | **C** | **A** |
| **Core REST API & Auth** | **C** | **R** | **I** | **A** | **I** |
| **AI Integration & Fallbacks** | **C** | **C** | **R** | **A** | **I** |
| **Real-Time SSE Streaming** | **C** | **R** | **I** | **C** | **A** |
| **Frontend Dual Portals** | **I** | **R** | **I** | **C** | **A** |
| **Automated Testing & Security**| **C** | **C** | **C** | **R** | **A** |
| **Deployment & Live Demo** | **A** | **R** | **I** | **C** | **A** |
| **Final Documentation Review** | **C** | **C** | **C** | **C** | **R** |

*R = Responsible (Executes), A = Accountable (Approves), C = Consulted (Provides Input), I = Informed (Kept Updated)*
