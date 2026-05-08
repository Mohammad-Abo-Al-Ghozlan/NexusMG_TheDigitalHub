# NexusMG Frontend Architecture Documentation

## 🚀 Overview
NexusMG's frontend is a high-performance, modern web application built with **React 18**, **Vite**, and **TypeScript**. It is designed with a focus on premium aesthetics, smooth animations, and a seamless user experience for both trainees and instructors.

---

## 🛠 Tech Stack
- **Framework**: React 18 (Functional Components, Hooks)
- **Build Tool**: Vite (Lightning-fast HMR)
- **Language**: TypeScript (Type safety across the app)
- **Styling**: TailwindCSS & Lucide React (Icons)
- **UI Components**: Shadcn/UI (Radix UI primitives)
- **State Management**: Zustand (Lightweight, atomic state)
- **Animations**: Framer Motion (Complex transitions, scroll reveals)
- **Forms**: React Hook Form + Zod (Strict validation)
- **Data Fetching**: Axios (Interceptors for JWT handling)

---

## 📂 Project Structure
```text
frontend/
├── src/
│   ├── components/       # Reusable UI primitives (Shadcn)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities (formatting, axios config)
│   ├── pages/            # Feature-based page components
│   │   ├── auth/         # Login, Register, Recovery
│   │   ├── trainee/      # Trainee-specific dashboards and evaluations
│   │   └── instructor/   # Management and oversight tools
│   ├── stores/           # Zustand state definitions
│   └── types/            # Global TypeScript interfaces
└── public/               # Static assets
```

---

## 🎨 Design System
### Aesthetics
The application follows a **Premium Dark/Glassmorphism** design language:
- **Colors**: Deep charcoals, vibrant accent blues, and sophisticated grays.
- **Micro-interactions**: Hover states, staggered list entrance animations, and progress bar transitions.
- **Glassmorphism**: Use of `backdrop-blur` and semi-transparent backgrounds for a layered feel.

### Core Components
- **ScrollReveal**: A custom wrapper using Framer Motion to animate elements as they enter the viewport.
- **Card**: Enhanced Shadcn cards with hover elevation and border glows.
- **Status Badges**: Color-coded badges for assessment statuses (Ready, Needs Work, Critical).

---

## 🔄 State Management
We use **Zustand** for global state. It provides a simple API without the boilerplate of Redux.
- **authStore**: Manages user sessions, JWT tokens, and role-based permissions.
- **evaluationStore**: Orchestrates AI evaluations (LinkedIn, GitHub, CV) and feedback persistence.
- **instructorStore**: Handles trainee oversight, reports, and analytics.

---

## 🔐 Authentication Flow
1. **Login**: User submits credentials -> Backend returns JWT.
2. **Persistence**: Token is stored in `localStorage` via Zustand middleware.
3. **Interceptor**: Axios automatically attaches `Authorization: Bearer <token>` to every request.
4. **Guards**: Role-based routing ensures Trainees cannot access Instructor dashboards.

---

## 📈 Optimization & Best Practices
- **Code Splitting**: Dynamic imports for routes to reduce initial bundle size.
- **Strict Typing**: All API responses and component props are strictly typed to prevent runtime errors.
- **Component Atomicity**: Breaking down large forms into smaller, manageable sub-components.
