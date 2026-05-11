# NexusMG: The Developer Readiness Engine

**Stop guessing. Start measuring.** NexusMG is a production-grade evaluation platform that quantifies developer employability. It moves beyond "portfolio projects" to provide a data-driven audit of an engineer's code, credentials, and communication.

---

## 🚀 The Value Proposition
For developers, NexusMG is a **pre-flight check** before hitting the job market. For hiring teams, it's a **standardized filter** that identifies high-signal talent through multi-dimensional analysis.

## 🛠 Product Features (Enabled Decisions)
*   **Automated Technical Forensics:** Analyzes GitHub repositories for "Professional Signal" (PR history, documentation, code modularity).
*   **ATS-Engine Audit:** Grades CVs against modern recruitment algorithms to ensure they aren't discarded by automated filters.
*   **System Design Evaluator:** Validates project architectures for scalability and best practices.
*   **Linguistic & Technical Stress Tests:** Evaluates English proficiency and technical articulation via AI-driven mock interviews.
*   **Comprehensive Reporting & Analytics:** Generates professional, downloadable PDF and CSV performance reports for both individual trainees and instructors managing cohorts.
*   **Real-time Messaging Hub:** Private chat between trainees, instructors, and admins with WebSocket delivery.
*   **Verified Identity Access:** Email verification + Google OAuth sign-in without disrupting JWT auth.

## ⚙️ How It Works: The Evaluation Pipeline
NexusMG operates as a centralized scoring engine:
1.  **Data Ingestion:** Securely pulls profiles via GitHub API, LinkedIn (Proxycurl), and File Uploads (CV).
2.  **Contextual Analysis:** Groq/Gemini-powered agents perform deep-reasoning audits on the ingested data.
3.  **Weighted Scoring:** A proprietary algorithm calculates the **Developer Readiness Score (DRS)** based on five key pillars (Code, Communication, Credentials, Architecture, Fluency).
4.  **Insight Generation:** Produces a structured JSON/PDF report with actionable "Fixes" to move the score upward.

## 📊 Sample Output (Technical Audit)
```json
{
  "readiness_score": 78,
  "breakdown": {
    "github_quality": 82,
    "cv_optimization": 64,
    "interview_performance": 71
  },
  "critical_fix": "CV fails ATS check due to multi-column layout. GitHub 'Project-A' contains exposed API secrets.",
  "status": "Market_Ready_Target_Mid_Level"
}
```

## 🏗 System Architecture
*   **Frontend:** React (Vite) + Tailwind + Framer Motion (Premium UI/UX).
*   **Backend:** FastAPI (Python) for high-concurrency async evaluation.
*   **Database:** MariaDB for persistent scoring history and user metrics.
*   **Intelligence:** 
    *   **Groq/Gemini:** Used for high-speed analysis of codebases and interview transcripts.
    *   **LinkdAPI / Proxycurl:** Real-time professional data retrieval from LinkedIn.

## 📂 Project Structure
```text
NexusMG_TheDigitalHub/
├── backend/                # FastAPI Application
│   ├── app/
│   │   ├── models/         # SQLAlchemy Models
│   │   ├── routes/         # API Endpoints
│   │   ├── schemas/        # Pydantic Schemas
│   │   ├── services/       # Business Logic & AI Integrations
│   │   └── main.py         # Entry Point
│   ├── scripts/            # Maintenance & Testing Scripts
│   ├── uploads/            # User Uploads (CVs, Avatars)
│   └── requirements.txt
├── frontend/               # React + Vite Application
│   ├── src/
│   │   ├── components/     # UI Components (Shadcn/UI)
│   │   ├── layouts/        # Page Layouts
│   │   ├── pages/          # Application Pages
│   │   ├── services/       # API Integration (Axios)
│   │   ├── stores/         # State Management (Zustand)
│   │   └── App.tsx
│   ├── public/             # Static Assets
│   └── package.json
├── components/             # Shared UI Components (Root level)
├── docs/                   # Advanced Documentation
│   ├── frontend.md         # Frontend Architecture & Design
│   ├── backend.md          # Backend Infrastructure & AI Pipeline
│   ├── project.md          # Global Project Overview & Roadmap
│   └── api_routes.md       # API Endpoint Reference
├── hooks/                  # Custom React Hooks
├── lib/                    # Shared Utilities
└── README.md
```

## ⚖️ Why NexusMG? (Differentiation)
Most AI tools are simple "Chat with your PDF" wrappers. NexusMG is an **Evaluator**.
*   **Cross-Signal Validation:** It checks if your CV claims match your actual GitHub activity.
*   **Weighted Reality:** It prioritizes code quality over "green squares" on GitHub.
*   **Actionable Roadmap:** It doesn't just say "you're bad"; it provides a prioritized list of tasks to become hireable.

## 📦 Installation & Deployment

### Prerequisites
* Python 3.11+
* Node.js 18+
* MariaDB Instance

### Quick Start
1. **Clone & Environment**
   ```bash
   git clone https://github.com/Mohammad-Abo-Al-Ghozlan/NexusMG_TheDigitalHub.git
  # Setup .env with GROQ_API_KEY, GEMINI_API_KEY, PROXYCURL_API_KEY, and DB_URL
   ```
2. **Backend Services**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
3. **Frontend Interface**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Root Workspace (npm workspaces)
If you prefer running from the repo root:
```bash
npm install
npm run dev        # frontend
npm run dev:backend
npm run dev:all
```

### Auth & Email Verification Setup
Add the following to backend `.env` (free/easy option: Gmail SMTP with an app password):
```bash
GOOGLE_CLIENT_ID=
APP_BASE_URL=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM="NexusMG <your_gmail@gmail.com>"
SMTP_USE_TLS=true
```

Add to frontend `.env`:
```bash
VITE_GOOGLE_CLIENT_ID=
```

Run the DB update script if needed:
```
db_update_2026_05_12_auth.sql
```

## 💬 Messaging (Real-time)
NexusMG includes a private messaging layer between trainees, instructors, and admins.

**WebSocket**
```
/api/v1/messages/ws?token=<JWT>
```

**REST**
```
GET  /api/v1/messages/contacts
GET  /api/v1/messages/history/{contact_id}
POST /api/v1/messages/send
```

## 🗺 Strategic Roadmap
*   **Q3 2024:** Direct integration with Greenhouse/Lever ATS for recruiters.
*   **Q4 2024:** "Portfolio-to-Code" generator based on architecture audit.
*   **Q1 2025:** Team-readiness mode for engineering managers to audit internal talent.

---

## 👥 Core Team
NexusMG is architected and maintained by:

* **Mohammad Abo Al Ghozlan** — [Email](mailto:abo.al.ghozlan.mohammad@gmail.com) | [LinkedIn](https://linkedin.com/in/mohammad-abo-al-ghozlan)  
* **Somaya Al Minawi** — [Email](mailto:sumayaminawi@gmail.com) | [LinkedIn](https://linkedin.com/in/somayaminawi)

---

<p align="center">
  <strong>Built for the modern engineering market.</strong>
</p>
