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
    // Don't redirect if the request was to the login endpoint itself
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
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
  getAll: () => api.get('/users/trainees'), // Match backend: list_all_trainees
  getById: (id: string) => api.get(`/users/trainees/${id}`),
  exportMyData: () => api.get('/users/me/export', { responseType: 'blob' }),
}

// CV Evaluation API
export const cvApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/evaluations/cv/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getLatest: () => api.get('/evaluations/cv/latest'),
  analyze: (evaluationId: number) => api.post(`/evaluations/cv/${evaluationId}/analyze`),
}

// GitHub Evaluation API
export const githubApi = {
  evaluate: (username: string) => api.post('/evaluations/github/analyze', { username }),
  getLatest: () => api.get('/evaluations/github/latest'),
}

// LinkedIn Evaluation API
export const linkedinApi = {
  evaluate: (profileUrl: string) => api.post('/evaluations/linkedin/analyze', { profile_url: profileUrl }),
  getLatest: () => api.get('/evaluations/linkedin/latest'),
}

// Idea Evaluation API
export const ideaApi = {
  submit: (data: { title: string; description: string; tech_stack: string[] }) =>
    api.post('/evaluations/idea/analyze', data),
  getLatest: () => api.get('/evaluations/idea/latest'),
}

// Interview API
export const interviewApi = {
  start: (topic: string, difficulty: string = 'intermediate') => 
    api.post('/evaluations/interview/start', { topic, difficulty }),
  submitAnswer: (evaluationId: number, questionId: number, answer: string) =>
    api.post(`/evaluations/interview/${evaluationId}/answer`, { question_id: questionId, answer }),
  complete: (evaluationId: number) => 
    api.post(`/evaluations/interview/${evaluationId}/complete`),
  getLatest: () => api.get('/evaluations/interview/latest'),
}

// English Assessment API
export const englishApi = {
  start: (type: string = 'comprehensive') => 
    api.post('/evaluations/english/start', { assessment_type: type }),
  submitAnswer: (evaluationId: number, questionId: number, answer: string) =>
    api.post(`/evaluations/english/${evaluationId}/answer`, { question_id: questionId, answer }),
  complete: (evaluationId: number) => 
    api.post(`/evaluations/english/${evaluationId}/complete`),
  getLatest: () => api.get('/evaluations/english/latest'),
}

// Instructor API
export const instructorApi = {
  getTrainees: () => api.get('/instructor/trainees'),
  getTraineeDetails: (id: string) => api.get(`/instructor/trainees/${id}`),
  getAnalytics: () => api.get('/instructor/analytics'),
  exportReport: (traineeId: string, format: 'pdf' | 'csv') =>
    api.get(`/instructor/export/${traineeId}`, { params: { format }, responseType: 'blob' }),
  exportAll: (format: 'pdf' | 'csv') => 
    api.get('/instructor/export-all', { params: { format }, responseType: 'blob' }),
  inviteTrainee: (email: string) => api.post('/instructor/invite', { email }),
}

// Readiness Score API
export const readinessApi = {
  getOverallScore: () => api.get('/readiness/score'),
  getModuleScores: () => api.get('/readiness/modules'),
  getHistory: () => api.get('/readiness/history'),
}
