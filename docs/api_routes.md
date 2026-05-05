# NexusMG API Documentation

This document outlines the available API endpoints for the NexusMG platform.

## Base URL
`http://localhost:8000/api/v1`

## Instructor Routes (`/instructor`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/instructor/analytics` | Get overview analytics for an instructor. |
| GET | `/instructor/trainees` | List all trainees assigned to the instructor. |
| GET | `/instructor/trainees/{id}` | Get detailed profile and scores for a trainee. |
| GET | `/instructor/trainees/{id}/evaluations` | List evaluations for a specific trainee. |

## User Routes (`/users`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Get current user profile. |
| PUT | `/users/me` | Update current user profile. |
| POST | `/users/me/avatar` | Update current user's avatar. |
| GET | `/users/me/readiness` | Get current user's readiness score. |
| POST | `/users/me/readiness/recalculate` | Recalculate readiness summary. |
| GET | `/users/trainees` | List all trainees (Instructor only). |

## Authentication Routes (`/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user. |
| POST | `/auth/login` | Login and get access token. |
| GET | `/auth/me` | Get current user information. |
| POST | `/auth/invite/instructor` | Create an instructor invite (Admin only). |

## Evaluation Routes (`/evaluations`)
- **CV**: `/evaluations/cv`
- **GitHub**: `/evaluations/github`
- **LinkedIn**: `/evaluations/linkedin`
- **Idea**: `/evaluations/idea`
- **Interview**: `/evaluations/interview`
- **English**: `/evaluations/english`

## Readiness Routes (`/readiness`)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/readiness/score` | Get current user's overall readiness score. |
| GET | `/readiness/modules` | Get scores for individual modules. |
| GET | `/readiness/history` | Get readiness score history. |
