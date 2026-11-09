# BookLeaf Publishing — Technical Assignment 2
## Author Royalty Dashboard & Automated Notification System
### Bubble.io + n8n Cloud + Google Gemini AI Integration

---

## Executive Summary & Quick Links
- **Admin Operations Console:** Available in Bubble Test Mode (`admin_dashboard`)
- **Author Royalty Portal:** Available in Bubble Test Mode (`author_dashboard`)
- **Pre-Seeded Test Credentials:**
  - **Operations Admin:** `admin@bookleafpub.com` / `admin123`
  - **Author (Priya Sharma - Pending):** `priya.sharma@email.com` / `author123`
- **Live n8n Cloud Webhook:** `https://sweetsalt.app.n8n.cloud/webhook/bookleaf-royalty`
- **Submission Collaborator:** `musavir@bookleafpub.in`
- **Production n8n Workflow Export:** [BookLeaf Royalty Summary & Notification Workflow.json](./BookLeaf%20Royalty%20Summary%20%26%20Notification%20Workflow.json)

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           BUBBLE.IO APPLICATION TIER                            │
│                                                                                 │
│   ┌───────────────────────────────────┐     ┌────────────────────────────────┐  │
│   │   Author Portal (/author_dash)    │     │  Admin Portal (/admin_dash)    │  │
│   │   • 2-Column Balance Sheet        │     │  • Author Directory Table      │  │
│   │   • 3-Color Dynamic Badges        │     │  • City & Payout Status Filter │  │
│   │   • Registered Books Catalog      │     │  • Author Detail Breakdown     │  │
│   └───────────────────────────────────┘     │  • "Generate Summary" Action   │  │
│                                             └───────────────┬────────────────┘  │
│   ┌───────────────────────────────────┐                     │                   │
│   │     Bubble Relational DB & Privacy│                     │ POST Webhook      │
│   │   • Author (cached aggregates)    │                     │ (API Connector)   │
│   │   • Book (itemized royalties)     │                     │                   │
│   │   • User (multi-tenant auth)      │                     ▼                   │
│   │   • Notification_Log (audit trail)│◄────────────────────┴────────────────┐  │
│   └───────────────────────────────────┘        Synchronous Response          │  │
│                                                 { status: "Success", ... }   │  │
└─────────────────────────────────────────────────────────────▲────────────────┘  │
                                                              │                   │
                                   ┌──────────────────────────┴───────────────────┴───┐
                                   │            n8n CLOUD AUTOMATION ENGINE           │
                                   │                                                  │
                                   │  [Node 1] Webhook Receiver (POST /bookleaf-...)  │
                                   │                            │                     │
                                   │  [Node 2] Security Check (x-bookleaf-api-key)    │
                                   │                            │                     │
                                   │  [Node 3] Data & Invariants Formatter (JS Code)  │
                                   │                            │                     │
                                   │  [Node 4 & 5] Google Gemini AI Model             │
                                   │               • Policy Grounded (80/20, ₹1000)   │
                                   │               • Zero Hallucination Engine        │
                                   │                            │                     │
                                   │  [Node 6] Respond to Webhook (JSON Response)     │
                                   └──────────────────────────────────────────────────┘
```

---

## 2. Bubble Database Schema & Structural Rationale

The database schema is designed around four relational entities with strict field types and strategic denormalization for high-throughput UI performance:

### 2.1 Schema Entities
1. **`Author`**:
   - Primary Identifiers: `author_id` (text), `name` (text), `email` (text), `phone` (text), `city` (text), `joined_date` (date)
   - Cached Aggregates: `cached_total_earned` (number), `cached_total_paid` (number), `cached_total_pending` (number), `cached_payout_status` (text)
   - *Rationale:* Placing pre-calculated financial aggregates on the Author entity avoids expensive nested calculations across repeating groups, enabling instant client-side search, city filtering, and status badge rendering.
2. **`Book`**:
   - Catalog Details: `book_id` (text), `author` (Author link), `title` (text), `isbn` (text), `genre` (text), `status` (text), `publication_date` (date), `print_partner` (text)
   - Itemized Financials: `mrp` (number), `author_royalty_per_copy` (number), `total_copies_sold` (number), `total_royalty_earned` (number), `royalty_paid` (number), `royalty_pending` (number), `last_royalty_payout_date` (date)
   - *Rationale:* Normalizes titles under their author (1-to-many relationship) while properly handling production titles (e.g., `In Production - Cover Design`) where ISBN and publication dates remain unassigned.
3. **`User`**:
   - Fields: `email` (text), `role` (`"admin"` | `"author"`), `author_profile` (Author link)
   - *Rationale:* Decouples authentication accounts from domain author entities and provides a 1-to-1 link for Bubble Privacy Rules.
4. **`Notification_Log`**:
   - Fields: `author` (Author link), `trigger_type` (`"manual"`), `status` (`"Success"` | `"Failed"`), `trigger_timestamp` (date), `completion_timestamp` (date), `generated_summary` (text), `error_message` (text), `idempotency_key` (text)
   - *Rationale:* Immutable audit ledger capturing every AI notification dispatch and storing Gemini's full output text directly on the author record.

### 2.2 Privacy & Security Rules (Data Tab -> Privacy)
- **`Author` Rules**:
  - `Admin Access`: `Current User's role is "admin"` $\rightarrow$ Full read & search permissions.
  - `Author Self Access`: `Current User's author_profile is This Author` $\rightarrow$ Full read & search permissions.
  - `Everyone else`: Completely unchecked (blocked).
- **`Book` Rules**:
  - `Admin Access`: `Current User's role is "admin"` $\rightarrow$ Full read permissions.
  - `Author Self Access`: `Current User's author_profile is This Book's author` $\rightarrow$ Full read permissions.
  - `Everyone else`: Completely unchecked (blocked).
- *Benefit:* Total multi-tenant isolation; authors cannot inspect or query another author's catalog or royalty statements.

---

## 3. How the Bubble ↔ n8n Integration Works

The system connects Bubble.io and n8n Cloud via Bubble's official **API Connector** plugin:

1. **Trigger Action:** In the Admin operations console, the administrator selects an author and clicks **"Generate & Send Royalty Summary"**.
2. **Secure HTTPS Webhook:** Bubble dispatches a POST request to `https://sweetsalt.app.n8n.cloud/webhook/bookleaf-royalty` with an enterprise security header:
   ```http
   x-bookleaf-api-key: bk_live_sec_89f02c78a1bc402
   ```
3. **Security Gatekeeping (Node 2):** n8n validates the key. Requests lacking or presenting an invalid header branch to `false` and return an HTTP 401 Unauthorized response.
4. **Data Normalization & Business Invariants (Node 3):** A JavaScript code node structures author information, catalog records, and applies payout threshold logic.
5. **AI Synthesis (Node 4 & 5):** Google Gemini generates the personalized royalty summary email.
6. **Synchronous Response via `Respond to Webhook` (Node 6):** Because Bubble's Free plan restricts incoming backend workflow webhooks (`/api/1.1/wf/...`), the workflow returns `{ status: "Success", generated_summary: "..." }` synchronously. Bubble captures this in Step 5 and writes it directly to `Notification_Log`.

---

## 4. AI Prompt Strategy & Zero-Hallucination Policy

The prompt governing Google Gemini (`gemini-1.5-flash`) is anchored in verified BookLeaf operational rules:

1. **80/20 Royalty Split:** Strictly 80% net profit to the author, 20% to BookLeaf Publishing.
2. **Quarterly Settlement Timing:** Royalties are disbursed via direct bank transfer within 45 calendar days following quarter close.
3. **Threshold Invariant Logic:**
   - **Pending $\ge ₹1,000$:** Scheduled for the upcoming quarterly payout run.
   - **Pending $< ₹1,000$:** Automatically rolls over to the subsequent quarter without administrative fees.
   - **Pending $= ₹0$:** Fully settled; no balance outstanding.
4. **Production Titles:** Books in design or typesetting are reported by status without artificial sales numbers.
5. **Strict Grounding:** Gemini is instructed with a zero-hallucination constraint—never invent sales figures, dates, transaction reference numbers, or payment commitments not supplied in the verified JSON payload.

---

## 5. Multi-Tier Error Handling Approach

- **Bubble API Connector Level:** Configured with `Include errors in response and allow workflow actions to continue` to prevent unhandled client crashes.
- **Workflow Branching:**
  - **Error Path (Step 3 & 4):** Triggers only when `Result of step 2's returned_an_error is yes` $\rightarrow$ marks `Notification_Log` status as `"Failed"`, logs diagnostic error message, and triggers an error alert.
  - **Success Path (Step 5 & 6):** Triggers only when `Result of step 2's returned_an_error is no` $\rightarrow$ marks status as `"Success"`, saves `body generated_summary`, and triggers an OK alert.
- **n8n Level:** Validates JSON structure, verifies security headers before invoking LLM nodes (saving AI compute costs), and handles payload edge cases gracefully.

---

## 6. Technical Challenges Faced & Learning Process

1. **Bubble Tier Constraints (CSV Import):** Bubble recently moved native CSV bulk uploads to the paid Starter plan. Rather than upgrading or compromising the schema, we seeded representative authors covering all business rules:
   - Farhan Sheikh (AUTH008): **Green** (`Fully Paid`) — ₹0 pending.
   - Priya Sharma (AUTH001): **Yellow** (`Pending`) — ₹3,570 pending in normal cycle.
   - Ananya Reddy (AUTH003): **Red** (`Overdue`) — Published >90 days, never paid.
   - Vikram Joshi (AUTH004): **Red** (`Overdue`) — Last payout >90 days ago.
2. **Overcoming Bubble Free Backend Workflow Paywalls:** Bubble Free disables incoming backend workflow webhooks (`/api/1.1/wf/...`), returning HTTP 401. To solve this, we architected n8n to respond synchronously via the `Respond to Webhook` node, returning the generated email directly in the API call response without needing paid Bubble features.
3. **Visual AST Expression Builder:** Shifting from code-based programming (`user.role === 'admin'`) to Bubble's chained dropdown parser required learning how Bubble traverses object references (`Current User's author_profile's role is "admin"`).
4. **AI Grounding & Credential Resilience:** Initial OpenAI personal keys encountered quota exhaustion (HTTP 429). We pivoted to Google Gemini (`gemini-1.5-flash`), setting temperature to 0.2 to deliver completely deterministic, policy-accurate summaries.

---

## 7. Test Scenarios & Verification Matrix

| Test Case | Scenario / Author | Expected Badge & Rule | Observed System Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Farhan Sheikh (AUTH008) | **Green: Fully Paid** (Pending = 0) | Green badge; ₹3,120 earned, ₹3,120 paid, ₹0 pending | **PASS** |
| **TC-02** | Priya Sharma (AUTH001) | **Yellow: Pending** (Normal cycle) | Yellow badge; ₹19,908 earned, ₹16,338 paid, ₹3,570 pending | **PASS** |
| **TC-03** | Ananya Reddy (AUTH003) | **Red: Overdue** (Never paid >90d) | Red badge; ₹2,546 pending, zero historical payouts | **PASS** |
| **TC-04** | Vikram Joshi (AUTH004) | **Red: Overdue** (Last payout >90d) | Red badge; ₹3,350 pending, last payout Aug 20, 2025 | **PASS** |
| **TC-05** | Directory Search Filter | Search query: `"Priya"` | Live table filters to Priya Sharma instantly | **PASS** |
| **TC-06** | Status Dropdown Filter | Filter: `"Overdue"` | Displays Ananya Reddy and Vikram Joshi only | **PASS** |
| **TC-07** | AI Summary Generation | Click "Generate & Send" | Gemini synthesizes summary; logged as `Success` | **PASS** |
