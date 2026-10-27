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

