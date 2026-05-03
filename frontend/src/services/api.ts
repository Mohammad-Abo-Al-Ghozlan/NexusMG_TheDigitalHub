import axios, { type AxiosError, type AxiosResponse } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; full_name: string; role?: string }) =>
    api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
}

// User API
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: Record<string, unknown>) => api.put('/users/me', data),
  getAll: () => api.get('/users'),
  getById: (id: string) => api.get(`/users/${id}`),
}

// CV Evaluation API
export const cvApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/cv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getEvaluation: (id: string) => api.get(`/cv/evaluation/${id}`),
  getMyEvaluations: () => api.get('/cv/evaluations'),
}

// GitHub Evaluation API
export const githubApi = {
  evaluate: (username: string) => api.post('/github/evaluate', { username }),
  getEvaluation: (id: string) => api.get(`/github/evaluation/${id}`),
  getMyEvaluations: () => api.get('/github/evaluations'),
}

// LinkedIn Evaluation API
export const linkedinApi = {
  evaluate: (profileUrl: string) => api.post('/linkedin/evaluate', { profile_url: profileUrl }),
  submitManual: (data: Record<string, unknown>) => api.post('/linkedin/submit-manual', data),
  getEvaluation: (id: string) => api.get(`/linkedin/evaluation/${id}`),
  getMyEvaluations: () => api.get('/linkedin/evaluations'),
}

// Idea Evaluation API
export const ideaApi = {
  submit: (data: { title: string; description: string; tech_stack: string[] }) =>
    api.post('/idea/submit', data),
  getEvaluation: (id: string) => api.get(`/idea/evaluation/${id}`),
  getMyEvaluations: () => api.get('/idea/evaluations'),
}

// Interview API
export const interviewApi = {
  start: (techStack: string[]) => api.post('/interview/start', { tech_stack: techStack }),
  submitAnswer: (interviewId: string, questionId: string, answer: string) =>
    api.post(`/interview/${interviewId}/answer`, { question_id: questionId, answer }),
  getQuestions: (interviewId: string) => api.get(`/interview/${interviewId}/questions`),
  getResults: (interviewId: string) => api.get(`/interview/${interviewId}/results`),
  getMyInterviews: () => api.get('/interview/my'),
}

// English Assessment API
export const englishApi = {
  start: () => api.post('/english/start'),
  submitAnswer: (assessmentId: string, questionId: string, answer: string) =>
    api.post(`/english/${assessmentId}/answer`, { question_id: questionId, answer }),
  getResults: (assessmentId: string) => api.get(`/english/${assessmentId}/results`),
  getMyAssessments: () => api.get('/english/my'),
}

// Instructor API
export const instructorApi = {
  getTrainees: () => api.get('/instructor/trainees'),
  getTraineeDetails: (id: string) => api.get(`/instructor/trainees/${id}`),
  inviteTrainee: (email: string) => api.post('/instructor/invite', { email }),
  getAnalytics: () => api.get('/instructor/analytics'),
  exportReport: (traineeId: string, format: 'pdf' | 'csv') =>
    api.get(`/instructor/export/${traineeId}`, { params: { format }, responseType: 'blob' }),
}

// Readiness Score API
export const readinessApi = {
  getOverallScore: () => api.get('/readiness/score'),
  getModuleScores: () => api.get('/readiness/modules'),
  getHistory: () => api.get('/readiness/history'),
}
