import { create } from 'zustand'
import { cvApi, githubApi, linkedinApi, ideaApi, interviewApi, englishApi, readinessApi } from '@/services/api'

export interface EvaluationResult {
  id: string
  module: string
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
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
  cvEvaluations: EvaluationResult[]
  cvLoading: boolean
  uploadCV: (file: File) => Promise<EvaluationResult>
  fetchCVEvaluations: () => Promise<void>
  
  // GitHub
  githubEvaluations: EvaluationResult[]
  githubLoading: boolean
  evaluateGitHub: (username: string) => Promise<EvaluationResult>
  fetchGitHubEvaluations: () => Promise<void>
  
  // LinkedIn
  linkedinEvaluations: EvaluationResult[]
  linkedinLoading: boolean
  evaluateLinkedIn: (profileUrl: string) => Promise<EvaluationResult>
  submitManualLinkedIn: (data: Record<string, unknown>) => Promise<EvaluationResult>
  fetchLinkedInEvaluations: () => Promise<void>
  
  // Idea
  ideaEvaluations: EvaluationResult[]
  ideaLoading: boolean
  submitIdea: (data: { title: string; description: string; tech_stack: string[] }) => Promise<EvaluationResult>
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
  
  // Error handling
  error: string | null
  clearError: () => void
}

export const useEvaluationStore = create<EvaluationState>((set, get) => ({
  // CV State
  cvEvaluations: [],
  cvLoading: false,
  
  uploadCV: async (file: File) => {
    set({ cvLoading: true, error: null })
    try {
      const response = await cvApi.upload(file)
      const evaluation = response.data
      set((state) => ({ 
        cvEvaluations: [evaluation, ...state.cvEvaluations],
        cvLoading: false 
      }))
      return evaluation
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'CV upload failed', cvLoading: false })
      throw error
    }
  },
  
  fetchCVEvaluations: async () => {
    set({ cvLoading: true })
    try {
      const response = await cvApi.getMyEvaluations()
      set({ cvEvaluations: response.data, cvLoading: false })
    } catch {
      set({ cvLoading: false })
    }
  },
  
  // GitHub State
  githubEvaluations: [],
  githubLoading: false,
  
  evaluateGitHub: async (username: string) => {
    set({ githubLoading: true, error: null })
    try {
      const response = await githubApi.evaluate(username)
      const evaluation = response.data
      set((state) => ({ 
        githubEvaluations: [evaluation, ...state.githubEvaluations],
        githubLoading: false 
      }))
      return evaluation
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'GitHub evaluation failed', githubLoading: false })
      throw error
    }
  },
  
  fetchGitHubEvaluations: async () => {
    set({ githubLoading: true })
    try {
      const response = await githubApi.getMyEvaluations()
      set({ githubEvaluations: response.data, githubLoading: false })
    } catch {
      set({ githubLoading: false })
    }
  },
  
  // LinkedIn State
  linkedinEvaluations: [],
  linkedinLoading: false,
  
  evaluateLinkedIn: async (profileUrl: string) => {
    set({ linkedinLoading: true, error: null })
    try {
      const response = await linkedinApi.evaluate(profileUrl)
      const evaluation = response.data
      set((state) => ({ 
        linkedinEvaluations: [evaluation, ...state.linkedinEvaluations],
        linkedinLoading: false 
      }))
      return evaluation
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'LinkedIn evaluation failed', linkedinLoading: false })
      throw error
    }
  },
  
  submitManualLinkedIn: async (data: Record<string, unknown>) => {
    set({ linkedinLoading: true, error: null })
    try {
      const response = await linkedinApi.submitManual(data)
      const evaluation = response.data
      set((state) => ({ 
        linkedinEvaluations: [evaluation, ...state.linkedinEvaluations],
        linkedinLoading: false 
      }))
      return evaluation
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'LinkedIn submission failed', linkedinLoading: false })
      throw error
    }
  },
  
  fetchLinkedInEvaluations: async () => {
    set({ linkedinLoading: true })
    try {
      const response = await linkedinApi.getMyEvaluations()
      set({ linkedinEvaluations: response.data, linkedinLoading: false })
    } catch {
      set({ linkedinLoading: false })
    }
  },
  
  // Idea State
  ideaEvaluations: [],
  ideaLoading: false,
  
  submitIdea: async (data) => {
    set({ ideaLoading: true, error: null })
    try {
      const response = await ideaApi.submit(data)
      const evaluation = response.data
      set((state) => ({ 
        ideaEvaluations: [evaluation, ...state.ideaEvaluations],
        ideaLoading: false 
      }))
      return evaluation
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Idea submission failed', ideaLoading: false })
      throw error
    }
  },
  
  fetchIdeaEvaluations: async () => {
    set({ ideaLoading: true })
    try {
      const response = await ideaApi.getMyEvaluations()
      set({ ideaEvaluations: response.data, ideaLoading: false })
    } catch {
      set({ ideaLoading: false })
    }
  },
  
  // Interview State
  interviewResults: [],
  interviewLoading: false,
  currentInterview: null,
  
  startInterview: async (techStack: string[]) => {
    set({ interviewLoading: true, error: null })
    try {
      const response = await interviewApi.start(techStack)
      const interview = response.data
      set({ currentInterview: interview, interviewLoading: false })
      return interview
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to start interview', interviewLoading: false })
      throw error
    }
  },
  
  submitInterviewAnswer: async (interviewId: string, questionId: string, answer: string) => {
    try {
      await interviewApi.submitAnswer(interviewId, questionId, answer)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to submit answer' })
      throw error
    }
  },
  
  fetchInterviewResults: async () => {
    set({ interviewLoading: true })
    try {
      const response = await interviewApi.getMyInterviews()
      set({ interviewResults: response.data, interviewLoading: false })
    } catch {
      set({ interviewLoading: false })
    }
  },
  
  // English State
  englishResults: [],
  englishLoading: false,
  currentAssessment: null,
  
  startEnglish: async () => {
    set({ englishLoading: true, error: null })
    try {
      const response = await englishApi.start()
      const assessment = response.data
      set({ currentAssessment: assessment, englishLoading: false })
      return assessment
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to start assessment', englishLoading: false })
      throw error
    }
  },
  
  submitEnglishAnswer: async (assessmentId: string, questionId: string, answer: string) => {
    try {
      await englishApi.submitAnswer(assessmentId, questionId, answer)
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to submit answer' })
      throw error
    }
  },
  
  fetchEnglishResults: async () => {
    set({ englishLoading: true })
    try {
      const response = await englishApi.getMyAssessments()
      set({ englishResults: response.data, englishLoading: false })
    } catch {
      set({ englishLoading: false })
    }
  },
  
  // Readiness State
  readinessScore: null,
  readinessLoading: false,
  
  fetchReadinessScore: async () => {
    set({ readinessLoading: true })
    try {
      const response = await readinessApi.getOverallScore()
      set({ readinessScore: response.data, readinessLoading: false })
    } catch {
      set({ readinessLoading: false })
    }
  },
  
  // Error
  error: null,
  clearError: () => set({ error: null }),
}))
