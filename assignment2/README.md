# BookLeaf Publishing — Technical Assignment 2
## Author Royalty Dashboard & Automated Notification System (Bubble.io + n8n + AI Integration)

Live Application & Demonstration Links:
- **Admin Portal (Version-Test):** Available in Bubble test mode
- **Author Portal (Version-Test):** Available in Bubble test mode
- **Test Admin Login:** `admin@bookleafpub.com` / `admin123`
- **Test Author Login:** `priya.sharma@email.com` / `author123`
- **n8n Workflow Webhook:** `https://sweetsalt.app.n8n.cloud/webhook/bookleaf-royalty`

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                      Bubble.io                         │
│                                                        │
│  ┌────────────────────────┐  ┌──────────────────────┐  │
│  │   Author Portal        │  │    Admin Portal      │  │
│  │ (/author_dashboard)    │  │ (/admin_dashboard)   │  │
│  │  - Balance Sheet       │  │  - Directory Table   │  │
│  │  - Status Badges       │  │  - Search & Filters  │  │
│  │  - Registered Books    │  │  - Author Detail     │  │
│  └────────────────────────┘  │  - Trigger Button    │  │
│                              └──────────┬───────────┘  │
│  ┌────────────────────────┐             │              │
│  │    Bubble Database     │             │ POST Webhook │
│  │  - User                │             │ (API Conn.)  │
│  │  - Author              │             │              │
│  │  - Book                │             ▼              │
│  │  - Notification_Log    │◄────────────┴───────────┐  │
│  └────────────────────────┘  Synchronous Response   │  │
│                               (status + AI summary) │  │
└─────────────────────────────────────────▲──────────────┘
                                          │
                        ┌─────────────────┴──────────────────┐
                        │             n8n Cloud              │
                        │                                    │
                        │  1. Webhook Receiver               │
                        │  2. x-bookleaf-api-key Auth Check  │
                        │  3. Data & Invariant Formatter     │
                        │  4. Google Gemini AI Model         │
                        │  5. Grounded Prompt Engine         │
                        │  6. Respond to Webhook (JSON)      │
                        └────────────────────────────────────┘
```

---

## 2. Bubble.io Implementation Details

### 2.1 Database Entities & Relationships
- **`Author`**:
  - `author_id` (text), `name` (text), `email` (text), `phone` (text), `city` (text), `joined_date` (date)
  - Pre-calculated financial fields: `cached_total_earned`, `cached_total_paid`, `cached_total_pending`, `cached_payout_status`
- **`Book`**:
  - `book_id` (text), `author` (Author link), `title` (text), `isbn` (text), `genre` (text), `status` (text), `publication_date` (date)
  - Financials: `mrp`, `author_royalty_per_copy`, `total_copies_sold`, `total_royalty_earned`, `royalty_paid`, `royalty_pending`, `last_royalty_payout_date`
- **`User`**:
  - `email` (text), `role` (`"admin"` | `"author"`), `author_profile` (Author link)
- **`Notification_Log`**:
  - `author` (Author link), `trigger_type` (text), `status` (`"Success"` | `"Failed"`), `trigger_timestamp` (date), `completion_timestamp` (date), `generated_summary` (text), `error_message` (text)

### 2.2 Privacy & Security Rules (Data Tab -> Privacy)
- **`Author` Privacy Rules**:
  - `Admin Access`: `Current User's role is "admin"` $\rightarrow$ View all fields, Find in searches.
  - `Author Self Access`: `Current User's author_profile is This Author` $\rightarrow$ View all fields, Find in searches.
  - `Everyone else`: All checkboxes unchecked (completely private).
- **`Book` Privacy Rules**:
  - `Admin Access`: `Current User's role is "admin"` $\rightarrow$ Full access.
  - `Author Self Access`: `Current User's author_profile is This Book's author` $\rightarrow$ Full access.
  - `Everyone else`: All checkboxes unchecked.

### 2.3 Status Badge Business Logic
1. **Green (`Fully Paid`)**: `cached_total_pending == 0`. (e.g. Farhan Sheikh: ₹3,120 earned, ₹3,120 paid, ₹0 pending).
2. **Yellow (`Pending`)**: Outstanding royalty within normal 90-day cycle. (e.g. Priya Sharma: ₹3,570 pending, last payout within 90 days).
3. **Red (`Overdue`)**:
   - Outstanding balance where last payout date > 90 days ago. (e.g. Vikram Joshi: last payout Aug 20, 2025).
   - OR book published > 90 days ago with zero payouts ever. (e.g. Ananya Reddy: published July 5, 2024, ₹2,546 pending, no payout ever).

---

## 3. n8n Automation & AI Workflow

### 3.1 Security Header Verification
Every webhook request from Bubble includes:
```http
x-bookleaf-api-key: bk_live_sec_89f02c78a1bc402
```
Node 2 (`Security & Header Check`) blocks unauthorized or missing keys and returns a `401 Unauthorized` status.

### 3.2 Grounded AI Prompt Policy (Zero Hallucination)
The Google Gemini AI node is strictly constrained by official BookLeaf business rules:
- **80/20 Net Royalty Split**: 80% to author, 20% to BookLeaf.
- **Quarterly Settlement**: Disbursed within 45 calendar days following quarter close.
- **₹1,000 Minimum Payout Threshold**:
  - $\ge ₹1,000$: Scheduled for the upcoming quarterly payout run.
  - $< ₹1,000$: Automatically rolled over to subsequent quarter without fees.
  - $= ₹0$: Account fully settled.
- **Production Status Handling**: Unreleased titles in cover design or typesetting do not report sales figures until live.

### 3.3 Synchronous Webhook Response
To provide an instantaneous user experience and eliminate dependency on Bubble paid backend workflow features, the n8n workflow utilizes the **Respond to Webhook** node. The AI-generated email summary is returned immediately in the HTTP payload and rendered directly in Bubble's Notification Audit Log.

---

## 4. Test Scenarios & Verification Matrix

| Test Case | Scenario / Author | Expected Badge | Verified Output |
| :--- | :--- | :--- | :--- |
| **TC-01** | Farhan Sheikh (AUTH008) | **Green (Fully Paid)** | ₹3,120 Earned, ₹3,120 Paid, ₹0 Pending |
| **TC-02** | Priya Sharma (AUTH001) | **Yellow (Pending)** | ₹19,908 Earned, ₹16,338 Paid, ₹3,570 Pending |
| **TC-03** | Ananya Reddy (AUTH003) | **Red (Overdue - Never Paid)** | Published >90 days, ₹2,546 Pending, ₹0 Paid |
| **TC-04** | Vikram Joshi (AUTH004) | **Red (Overdue - >90 Days)** | Last payout Aug 20, 2025 (>90 days), ₹3,350 Pending |
| **TC-05** | Search Filter (Admin) | Filter by name `"Priya"` | Instantly filters to Priya Sharma |
| **TC-06** | Status Filter (Admin) | Filter by `"Overdue"` | Displays Ananya Reddy and Vikram Joshi |
| **TC-07** | AI Summary Trigger | Click "Generate & Send" | Gemini generates email; logged as `Success` with full text |
