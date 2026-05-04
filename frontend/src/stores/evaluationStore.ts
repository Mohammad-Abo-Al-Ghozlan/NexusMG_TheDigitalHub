import { create } from 'zustand'
import { api } from '@/services/api'

export interface EvaluationResult {
  id: string
  module: string
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
  details?: Record<string, unknown>
  created_at: string
}

export interface ReadinessScore {
  overall: number
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  modules: {
    cv: number
    github: number
    linkedin: number
    idea: number
    interview: number
    english: number
  }
}

interface EvaluationState {
  // CV
  cvResults: EvaluationResult[]
  cvLoading: boolean
  submitCV: (file: File) => Promise<void>
  fetchCVResults: () => Promise<void>

  // GitHub
  githubEvaluations: EvaluationResult[]
  githubLoading: boolean
  evaluateGitHub: (username: string) => Promise<void>
  fetchGitHubEvaluations: () => Promise<void>

  // LinkedIn
  linkedinEvaluations: EvaluationResult[]
  linkedinLoading: boolean
  evaluateLinkedIn: (profileUrl: string) => Promise<void>
  submitManualLinkedIn: (data: Record<string, unknown>) => Promise<void>
  fetchLinkedInEvaluations: () => Promise<void>

  // Idea
  ideaEvaluations: EvaluationResult[]
  ideaLoading: boolean
  submitIdea: (data: { title: string; description: string; tech_stack: string[] }) => Promise<void>
  fetchIdeaEvaluations: () => Promise<void>

  // Interview
  interviewResults: EvaluationResult[]
  interviewLoading: boolean
  currentInterview: { id: string; questions: unknown[] } | null
  startInterview: (techStack: string[]) => Promise<{ id: string; questions: unknown[] }>
  submitInterviewAnswer: (interviewId: string, questionId: string, answer: string) => Promise<void>
  fetchInterviewResults: () => Promise<void>

  // English
  englishResults: EvaluationResult[]
  englishLoading: boolean
  currentAssessment: { id: string; questions: unknown[] } | null
  startEnglish: () => Promise<{ id: string; questions: unknown[] }>
  submitEnglishAnswer: (assessmentId: string, questionId: string, answer: string) => Promise<void>
  fetchEnglishResults: () => Promise<void>

  // Readiness
  readinessScore: ReadinessScore | null
  readinessLoading: boolean
  fetchReadinessScore: () => Promise<void>

  // Error
  error: string | null
  clearError: () => void
}

// VITE_API_URL = http://localhost:8000/api/v1
// So all paths here should be relative without /v1 prefix, e.g. '/evaluations/cv/...'
const safeFetch = async <T>(fn: () => Promise<T>): Promise<T | null> => {
  try {
    return await fn()
  } catch {
    return null
  }
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  // ── CV ──────────────────────────────────────────────────────────
  cvResults: [],
  cvLoading: false,

  submitCV: async (file: File) => {
    set({ cvLoading: true, error: null })
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/evaluations/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      set((s) => ({ cvResults: [res.data, ...s.cvResults], cvLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'CV upload failed', cvLoading: false })
      throw e
    }
  },

  fetchCVResults: async () => {
    set({ cvLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/cv/latest'))
    set({ cvResults: res ? [res.data] : [], cvLoading: false })
  },

  // ── GitHub ──────────────────────────────────────────────────────
  githubEvaluations: [],
  githubLoading: false,

  evaluateGitHub: async (username: string) => {
    set({ githubLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/github/analyze', { username })
      set((s) => ({ githubEvaluations: [res.data, ...s.githubEvaluations], githubLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'GitHub evaluation failed', githubLoading: false })
      throw e
    }
  },

  fetchGitHubEvaluations: async () => {
    set({ githubLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/github/latest'))
    set({ githubEvaluations: res ? [res.data] : [], githubLoading: false })
  },

  // ── LinkedIn ────────────────────────────────────────────────────
  linkedinEvaluations: [],
  linkedinLoading: false,

  evaluateLinkedIn: async (profileUrl: string) => {
    set({ linkedinLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/linkedin/analyze', { profile_url: profileUrl })
      set((s) => ({ linkedinEvaluations: [res.data, ...s.linkedinEvaluations], linkedinLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'LinkedIn evaluation failed', linkedinLoading: false })
      throw e
    }
  },

  submitManualLinkedIn: async (data: Record<string, unknown>) => {
    set({ linkedinLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/linkedin/manual', data)
      set((s) => ({ linkedinEvaluations: [res.data, ...s.linkedinEvaluations], linkedinLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'LinkedIn submission failed', linkedinLoading: false })
      throw e
    }
  },

  fetchLinkedInEvaluations: async () => {
    set({ linkedinLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/linkedin/latest'))
    set({ linkedinEvaluations: res ? [res.data] : [], linkedinLoading: false })
  },

  // ── Idea ────────────────────────────────────────────────────────
  ideaEvaluations: [],
  ideaLoading: false,

  submitIdea: async (data) => {
    set({ ideaLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/idea/submit', data)
      set((s) => ({ ideaEvaluations: [res.data, ...s.ideaEvaluations], ideaLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Idea submission failed', ideaLoading: false })
      throw e
    }
  },

  fetchIdeaEvaluations: async () => {
    set({ ideaLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/idea/latest'))
    set({ ideaEvaluations: res ? [res.data] : [], ideaLoading: false })
  },

  // ── Interview ───────────────────────────────────────────────────
  interviewResults: [],
  interviewLoading: false,
  currentInterview: null,

  startInterview: async (techStack: string[]) => {
    set({ interviewLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/interview/start', { tech_stack: techStack })
      set({ currentInterview: res.data, interviewLoading: false })
      return res.data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to start interview', interviewLoading: false })
      throw e
    }
  },

  submitInterviewAnswer: async (interviewId: string, questionId: string, answer: string) => {
    try {
      await api.post(`/evaluations/interview/${interviewId}/answer`, { question_id: questionId, answer })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to submit answer' })
      throw e
    }
  },

  fetchInterviewResults: async () => {
    set({ interviewLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/interview/my'))
    set({ interviewResults: res ? (Array.isArray(res.data) ? res.data : [res.data]) : [], interviewLoading: false })
  },

  // ── English ─────────────────────────────────────────────────────
  englishResults: [],
  englishLoading: false,
  currentAssessment: null,

  startEnglish: async () => {
    set({ englishLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/english/start')
      set({ currentAssessment: res.data, englishLoading: false })
      return res.data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to start assessment', englishLoading: false })
      throw e
    }
  },

  submitEnglishAnswer: async (assessmentId: string, questionId: string, answer: string) => {
    try {
      await api.post(`/evaluations/english/${assessmentId}/answer`, { question_id: questionId, answer })
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to submit answer' })
      throw e
    }
  },

  fetchEnglishResults: async () => {
    set({ englishLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/english/my'))
    set({ englishResults: res ? (Array.isArray(res.data) ? res.data : [res.data]) : [], englishLoading: false })
  },

  // ── Readiness ───────────────────────────────────────────────────
  readinessScore: null,
  readinessLoading: false,

  fetchReadinessScore: async () => {
    set({ readinessLoading: true })
    // Endpoint may not be implemented yet — silently return null
    const res = await safeFetch(() => api.get('/readiness/score'))
    set({ readinessScore: res ? res.data : null, readinessLoading: false })
  },

  // ── Error ────────────────────────────────────────────────────────
  error: null,
  clearError: () => set({ error: null }),
}))
