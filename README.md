<p align="center">
  <img src="https://img.shields.io/badge/NexusMG-Developer%20Readiness-6366f1?style=for-the-badge&logo=rocket&logoColor=white" alt="NexusMG"/>
</p>

<h1 align="center">🚀 NexusMG — AI-Powered Developer Readiness Platform</h1>

<p align="center">
  <strong>Measure. Improve. Get Hired.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/MariaDB-10.x-003545?style=flat-square&logo=mariadb&logoColor=white" alt="MariaDB"/>
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License"/>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-installation">Installation</a> •
  <a href="#-api-documentation">API Docs</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## 📋 Overview

**NexusMG** is an enterprise-grade SaaS platform designed to assess and enhance developer readiness for the job market. By leveraging AI-powered evaluations across multiple dimensions—CV analysis, GitHub activity, LinkedIn profiles, mock interviews, and more—NexusMG provides actionable insights for trainees, instructors, and organizations.

> 💡 Built for training centers, bootcamps, and hiring teams to streamline developer assessment and career preparation.

---

## ✨ Features

### 🎯 Core Evaluation Modules

| Module | Description |
|--------|-------------|
| **📄 CV Evaluation** | AI-powered resume parsing and scoring using spaCy/NLTK |
| **🐙 GitHub Analysis** | Repository stats, activity metrics, language proficiency analysis |
| **💼 LinkedIn Evaluation** | Hybrid auto-fetch + manual fallback profile assessment via Proxycurl |
| **💡 Idea Architecture** | Project feasibility, complexity, and architecture evaluation |
| **🎤 Mock Interview** | AI-generated technical interview simulation with Groq/Gemini |
| **📝 English Proficiency** | Grammar, fluency, vocabulary, and coherence assessment |

### 👥 Role-Based Dashboards

- **Trainee Dashboard** — Personal readiness score, subscores, AI recommendations, progress tracking
- **Instructor Dashboard** — Trainee oversight, readiness distribution, weakness analytics
- **Admin Panel** — System management, user administration, analytics

### 🏢 Enterprise Features

- Multi-tenant architecture
- Role-based access control (RBAC)
- Invite-only instructor onboarding
- Real-time progress tracking
- Comprehensive analytics & reporting

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NEXUSMG PLATFORM                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        FRONTEND (React + TypeScript)                 │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   Landing   │ │    Auth     │ │  Dashboard  │ │   Modules   │   │   │
│  │  │    Page     │ │   System    │ │   System    │ │   Pages     │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        BACKEND (FastAPI + Python)                    │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │    Auth     │ │  Evaluation │ │     AI      │ │    User     │   │   │
│  │  │  Service    │ │   Engine    │ │  Services   │ │  Management │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                     │                                       │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        DATABASE (MariaDB)                            │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │    Users    │ │ Evaluations │ │   Scores    │ │   Sessions  │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

                            EXTERNAL INTEGRATIONS
    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
    │   Groq API  │  │  GitHub API │  │  Proxycurl  │  │ spaCy/NLTK  │
    │   (LLM)     │  │   (REST)    │  │ (LinkedIn)  │  │  (NLP)      │
    └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘
```

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI Framework |
| **TypeScript** | Type Safety |
| **Tailwind CSS** | Styling |
| **React Router v6** | Navigation |
| **React Query / SWR** | Data Fetching & Caching |
| **Zustand / Redux Toolkit** | State Management |
| **Recharts** | Data Visualization |
| **Axios** | HTTP Client |

### Backend
| Technology | Purpose |
|------------|---------|
| **FastAPI** | Web Framework |
| **Python 3.11+** | Runtime |
| **SQLAlchemy** | ORM |
| **Pydantic** | Data Validation |
| **Alembic** | Database Migrations |
| **python-jose** | JWT Authentication |
| **bcrypt** | Password Hashing |
| **uvicorn** | ASGI Server |

### Database
| Technology | Purpose |
|------------|---------|
| **MariaDB 10.x** | Primary Database |
| **phpMyAdmin** | Database Administration |
| **Redis** | Caching & Sessions (Optional) |

### AI/ML Services
| Service | Purpose |
|---------|---------|
| **Groq API** | LLM for text analysis & interviews |
| **Gemini API** | Alternative LLM provider |
| **spaCy** | CV/Resume parsing |
| **NLTK** | Natural language processing |
| **Proxycurl API** | LinkedIn profile data extraction |
| **GitHub REST API** | Repository & activity analysis |

---

## 📁 Project Structure

```
nexusmg/
├── frontend/                    # React Frontend Application
│   ├── public/
│   │   └── assets/
│   ├── src/
│   │   ├── components/          # Reusable UI Components
│   │   │   ├── ui/              # Base UI components
│   │   │   ├── charts/          # Data visualization
│   │   │   ├── forms/           # Form components
│   │   │   └── layout/          # Layout components
│   │   ├── pages/               # Page Components
│   │   │   ├── Landing/
│   │   │   ├── Auth/
│   │   │   ├── Dashboard/
│   │   │   ├── CVEvaluation/
│   │   │   ├── GitHubEvaluation/
│   │   │   ├── LinkedInEvaluation/
│   │   │   ├── IdeaArchitecture/
│   │   │   ├── MockInterview/
│   │   │   └── EnglishTest/
│   │   ├── hooks/               # Custom React Hooks
│   │   ├── services/            # API Service Layer
│   │   ├── store/               # State Management
│   │   ├── types/               # TypeScript Definitions
│   │   ├── utils/               # Utility Functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                     # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                 # API Routes
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── users.py
│   │   │   │   ├── evaluations.py
│   │   │   │   ├── cv.py
│   │   │   │   ├── github.py
│   │   │   │   ├── linkedin.py
│   │   │   │   ├── interview.py
│   │   │   │   └── english.py
│   │   │   └── deps.py          # Dependencies
│   │   ├── core/                # Core Configuration
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/              # SQLAlchemy Models
│   │   │   ├── user.py
│   │   │   ├── evaluation.py
│   │   │   └── score.py
│   │   ├── schemas/             # Pydantic Schemas
│   │   │   ├── user.py
│   │   │   ├── evaluation.py
│   │   │   └── response.py
│   │   ├── services/            # Business Logic
│   │   │   ├── ai_service.py
│   │   │   ├── cv_parser.py
│   │   │   ├── github_analyzer.py
│   │   │   ├── linkedin_fetcher.py
│   │   │   └── scoring_engine.py
│   │   ├── utils/               # Utilities
│   │   └── main.py              # Application Entry
│   ├── alembic/                 # Database Migrations
│   ├── tests/                   # Test Suite
│   ├── requirements.txt
│   └── .env.example
│
├── database/                    # Database Configuration
│   ├── init.sql                 # Initial Schema
│   ├── seeds/                   # Seed Data
│   └── migrations/              # Migration Scripts
│
├── docker/                      # Docker Configuration
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── docker-compose.yml
│
├── docs/                        # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── .github/                     # GitHub Configuration
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
│
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.11
- **MariaDB** >= 10.6
- **pnpm** (recommended) or npm
- **Git**

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-org/nexusmg.git
cd nexusmg
```

### 2️⃣ Database Setup

```bash
# Start MariaDB (if using Docker)
docker run -d \
  --name nexusmg-db \
  -e MYSQL_ROOT_PASSWORD=your_root_password \
  -e MYSQL_DATABASE=nexusmg \
  -e MYSQL_USER=nexusmg_user \
  -e MYSQL_PASSWORD=your_password \
  -p 3306:3306 \
  mariadb:10.11

# Or use phpMyAdmin for GUI management
docker run -d \
  --name phpmyadmin \
  --link nexusmg-db:db \
  -p 8080:80 \
  phpmyadmin/phpmyadmin
```

Access phpMyAdmin at `http://localhost:8080`

### 3️⃣ Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
alembic upgrade head

# Start the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4️⃣ Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend (`.env`)

```env
# Application
APP_NAME=NexusMG
APP_ENV=development
DEBUG=true
SECRET_KEY=your-super-secret-key-change-in-production

# Database (MariaDB)
DATABASE_URL=mysql+pymysql://nexusmg_user:your_password@localhost:3306/nexusmg
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=10

# JWT Authentication
JWT_SECRET_KEY=your-jwt-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# AI Services
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key

# External APIs
GITHUB_API_TOKEN=your-github-personal-access-token
LinkdAPI_API_KEY=your-proxycurl-api-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Redis (Optional)
REDIS_URL=redis://localhost:6379/0
```

#### Frontend (`.env.local`)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=NexusMG
VITE_APP_ENV=development
```

---

## 📖 API Documentation

Once the backend is running, access the interactive API documentation:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/login` | User authentication |
| `POST` | `/api/v1/auth/register` | Trainee registration |
| `GET` | `/api/v1/users/me` | Get current user |
| `POST` | `/api/v1/cv/evaluate` | Evaluate CV/Resume |
| `POST` | `/api/v1/github/analyze` | Analyze GitHub profile |
| `POST` | `/api/v1/linkedin/fetch` | Fetch LinkedIn data |
| `POST` | `/api/v1/linkedin/evaluate` | Evaluate LinkedIn profile |
| `POST` | `/api/v1/idea/evaluate` | Evaluate project idea |
| `POST` | `/api/v1/interview/generate` | Generate interview questions |
| `POST` | `/api/v1/interview/evaluate` | Evaluate interview answers |
| `POST` | `/api/v1/english/test` | English proficiency test |
| `GET` | `/api/v1/dashboard/trainee` | Trainee dashboard data |
| `GET` | `/api/v1/dashboard/instructor` | Instructor dashboard data |

---

## 🐳 Docker Deployment

### Using Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://backend:8000/api/v1
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=mysql+pymysql://nexusmg_user:password@db:3306/nexusmg
    depends_on:
      - db

  db:
    image: mariadb:10.11
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=nexusmg
      - MYSQL_USER=nexusmg_user
      - MYSQL_PASSWORD=password
    volumes:
      - mariadb_data:/var/lib/mysql

  phpmyadmin:
    image: phpmyadmin/phpmyadmin
    ports:
      - "8080:80"
    environment:
      - PMA_HOST=db
    depends_on:
      - db

volumes:
  mariadb_data:
```

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## 🗄️ Database Schema

### Core Tables

```sql
-- Users Table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('TRAINEE', 'INSTRUCTOR', 'ADMIN') DEFAULT 'TRAINEE',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Evaluations Table
CREATE TABLE evaluations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('CV', 'GITHUB', 'LINKEDIN', 'IDEA', 'INTERVIEW', 'ENGLISH') NOT NULL,
    score DECIMAL(5,2),
    data JSON,
    feedback JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Readiness Scores Table
CREATE TABLE readiness_scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    overall_score DECIMAL(5,2),
    cv_score DECIMAL(5,2),
    github_score DECIMAL(5,2),
    linkedin_score DECIMAL(5,2),
    idea_score DECIMAL(5,2),
    interview_score DECIMAL(5,2),
    english_score DECIMAL(5,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Instructor Invites Table
CREATE TABLE instructor_invites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    invited_by INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    FOREIGN KEY (invited_by) REFERENCES users(id)
);
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_auth.py -v
```

### Frontend Tests

```bash
cd frontend

# Run unit tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e
```

---

## 📊 Monitoring & Logging

### Application Metrics

- Request latency and throughput
- AI service response times
- Database query performance
- Error rates by endpoint

### Recommended Tools

- **Prometheus + Grafana** — Metrics visualization
- **Sentry** — Error tracking
- **ELK Stack** — Log aggregation

---

## 🔐 Security

### Implemented Security Measures

- ✅ JWT-based authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Role-based access control (RBAC)
- ✅ SQL injection prevention via parameterized queries
- ✅ XSS protection with input sanitization
- ✅ CORS configuration
- ✅ Rate limiting on API endpoints
- ✅ HTTPS enforcement in production

### Security Best Practices

```python
# Example: Secure password hashing
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](docs/CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation
- `style:` — Code style changes
- `refactor:` — Code refactoring
- `test:` — Adding tests
- `chore:` — Maintenance

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👥 Team

| Role | Responsibility |
|------|----------------|
| **Project Lead** | Architecture & Strategy |
| **Frontend Team** | React UI Development |
| **Backend Team** | FastAPI & AI Integration |
| **DevOps** | Infrastructure & CI/CD |
| **QA** | Testing & Quality Assurance |

---

## 📞 Support

For questions, bug reports, or support requests, please reach out to the authors directly:

| Name                      | Email                                  | Phone              |
|---------------------------|----------------------------------------|--------------------|
| Mohammad Abo Al Ghozlan   | 📧 [abo.al.ghozlan.mohammad@gmail.com](mailto:abo.al.ghozlan.mohammad@gmail.com)   | 📞 [81 985 614](tel:+96181985614)    |
| Somaya Al Minawi          | 📧 [sumayaminawi@gmail.com](mailto:sumayaminawi@gmail.com)   | 📞 [+961 78 979 310](tel:+96178979310)    |

To report a bug or request a feature, please contact the authors via email with the subject line:
`[NexusMG] Bug Report` or `[NexusMG] Feature Request`

---

<p align="center">
  <strong>Built with ❤️ by the NexusMG Team</strong>
</p>

<p align="center">
  <a href="https://nexusmg.io">Website</a> •
  <a href="https://twitter.com/nexusmg">Twitter</a> •
  <a href="https://linkedin.com/company/nexusmg">LinkedIn</a>
</p>
