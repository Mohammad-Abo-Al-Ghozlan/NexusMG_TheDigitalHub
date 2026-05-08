# NexusMG Backend Architecture Documentation

## ⚙️ Overview
The NexusMG backend is a robust, scalable **FastAPI** application designed to handle complex AI-driven evaluations and secure data management. It leverages asynchronous programming to provide high throughput and low latency.

---

## 🛠 Tech Stack
- **Framework**: FastAPI (Python 3.10+)
- **Database**: PostgreSQL (Relational data storage)
- **ORM**: SQLAlchemy 2.0 (Async mode)
- **Migrations**: Alembic
- **AI Integration**: LiteLLM / Groq (Multi-model support)
- **Security**: Passlib (Bcrypt hashing), PyJWT (Bearer tokens)
- **Validation**: Pydantic v2 (Strict data schemas)

---

## 📂 Core Components
### 1. API Layers (`app/routes/`)
Structured by domain:
- `auth.py`: User registration, login, and token refresh logic.
- `users.py`: Profile management and role-based data retrieval.
- `evaluations.py`: Main entry point for AI analysis requests (LinkedIn, GitHub, etc.).
- `instructors.py`: Reporting and trainee management endpoints.

### 2. Business Logic (`app/services/`)
- **AI Service**: Handles prompts, model switching, and response parsing.
- **Evaluation Service**: Business rules for calculating readiness scores and generating feedback.
- **User Service**: Identity management and permission verification.

### 3. Data Persistence (`app/models/`)
- **User**: Core identity model with role flags.
- **Evaluation**: Stores scores, raw AI feedback, and JSONB details.
- **Relationship**: Links trainees to instructors for institutional oversight.

---

## 🤖 AI Evaluation Pipeline
1. **Request Intake**: Validates input (URL or manual data).
2. **Context Assembly**: Gathers relevant user history and prompt templates.
3. **Async AI Call**: Uses LiteLLM to interface with LLMs (Claude, GPT, or Llama via Groq).
4. **Structured Parsing**: Transforms raw AI text into validated JSON scores.
5. **Score Aggregation**: Updates the trainee's "Readiness Index" in real-time.

---

## 🔐 Security Architecture
- **JWT Authentication**: Short-lived access tokens with secure hashing.
- **Password Hashing**: Bcrypt with adaptive work factor.
- **Dependency Injection**: Used for DB sessions and user verification to ensure clean, testable code.
- **CORS Handling**: Restricted to trusted origins for frontend safety.

---

## 🚀 Performance Features
- **Async Database Sessions**: Non-blocking I/O for high-concurrency scenarios.
- **JSONB Optimization**: Storing complex AI reports in PostgreSQL JSONB fields for flexible querying.
- **Auto-generated API Docs**: Interactive Swagger (`/docs`) and Redoc (`/redoc`) endpoints.
