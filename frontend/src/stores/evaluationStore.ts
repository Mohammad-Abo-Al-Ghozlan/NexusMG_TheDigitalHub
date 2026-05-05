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
  completeInterview: (interviewId: string) => Promise<void>
  fetchInterviewResults: () => Promise<void>

  // English
  englishResults: EvaluationResult[]
  englishLoading: boolean
  currentAssessment: { id: string; questions: unknown[] } | null
  startEnglish: () => Promise<{ id: string; questions: unknown[] }>
  submitEnglishAnswer: (assessmentId: string, questionId: string, answer: string) => Promise<void>
  completeEnglish: (assessmentId: string) => Promise<void>
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

type EvaluationModule = 'cv' | 'github' | 'linkedin' | 'idea' | 'interview' | 'english'

const toIso = (value?: string) => value || new Date().toISOString()

const mapDifficulty = (difficulty?: string) => {
  const normalized = (difficulty || '').toLowerCase()
  if (normalized === 'easy' || normalized === 'medium' || normalized === 'hard') return normalized
  if (normalized === 'beginner') return 'easy'
  if (normalized === 'advanced') return 'hard'
  return 'medium'
}

const buildEvaluationResult = (
  module: EvaluationModule,
  options: { evaluation?: Record<string, any>; analysis?: Record<string, any>; fallbackId?: string }
): EvaluationResult => {
  const evaluation = options.evaluation || {}
  const analysis = options.analysis || evaluation.analysis || {}
  const id = String(evaluation.id ?? options.fallbackId ?? Date.now())
  const created_at = toIso(evaluation.created_at)
  const score = Number(evaluation.score ?? analysis.overall_score ?? analysis.overall ?? 0)
  const feedback = evaluation.feedback ?? analysis.feedback ?? ''
  const strengths = analysis.strengths ?? analysis.swot_analysis?.strengths ?? []
  const improvements =
    analysis.weaknesses ??
    analysis.areas_for_improvement ??
    analysis.swot_analysis?.weaknesses ??
    []

  let details: Record<string, unknown> | undefined
  if (module === 'cv') {
    const skills = Array.isArray(analysis.skills)
      ? analysis.skills
      : Array.isArray(analysis.skills?.all)
        ? analysis.skills.all
        : []
    details = {
      strengths,
      improvements,
      ats_score: analysis.format_score ?? analysis.content_score ?? 0,
      keywords: skills,
      suggestions: analysis.recommendations ?? [],
    }
  } else if (module === 'github') {
    const profile = analysis.profile || {}
    const metrics = analysis.metrics || {}
    details = {
      total_repos: profile.public_repos ?? metrics.total_repos ?? 0,
      total_stars: metrics.total_stars ?? 0,
      languages: analysis.languages ?? {},
      commit_frequency: 0,
      code_quality_score: analysis.code_quality_score ?? 0,
      contributions_last_year: 0,
    }
  } else if (module === 'linkedin') {
    const profile = analysis.profile_data || {}
    details = {
      profile_completeness: analysis.completeness_score ?? 0,
      headline_score: profile.headline ? 100 : 0,
      summary_score: profile.summary ? 100 : 0,
      experience_count: Array.isArray(profile.experiences) ? profile.experiences.length : 0,
      skills_count: Array.isArray(profile.skills) ? profile.skills.length : 0,
      recommendations_count: 0,
      network_size: profile.connections ? `${profile.connections}+` : (profile.follower_count ? `${profile.follower_count}+` : 'N/A'),
    }
  } else if (module === 'idea') {
    const technical = Number(analysis.technical_score ?? 0)
    const technical_complexity = technical >= 70 ? 'High' : technical >= 40 ? 'Medium' : 'Low'
    details = {
      innovation_score: analysis.innovation_score ?? 0,
      feasibility_score: analysis.feasibility_score ?? 0,
      market_potential: analysis.market_score ?? 0,
      technical_complexity,
      suggested_improvements: analysis.recommendations ?? [],
    }
  } else if (module === 'interview') {
    details = {
      technical_accuracy: analysis.technical_score ?? 0,
      communication_score: analysis.communication_score ?? 0,
      problem_solving_score: analysis.problem_solving_score ?? 0,
      questions_answered: Array.isArray(analysis.questions_analysis) ? analysis.questions_analysis.length : 0,
      total_questions: Array.isArray(analysis.questions_analysis) ? analysis.questions_analysis.length : 0,
    }
  } else if (module === 'english') {
    details = {
      grammar_score: analysis.grammar_score ?? 0,
      vocabulary_score: analysis.vocabulary_score ?? 0,
      fluency_level: analysis.cefr_level ?? 'N/A',
      cefr_level: analysis.cefr_level ?? 'N/A',
      areas_to_improve: analysis.recommendations ?? [],
    }
  }

  return {
    id,
    module,
    score,
    feedback,
    strengths: Array.isArray(strengths) ? strengths : [],
    improvements: Array.isArray(improvements) ? improvements : [],
    details,
    created_at,
  }
}

const mapInterviewQuestions = (questions: Array<Record<string, any>>) =>
  questions.map((q) => {
    const difficulty = mapDifficulty(q.difficulty)
    const time_limit = difficulty === 'easy' ? 90 : difficulty === 'hard' ? 180 : 120
    return {
      id: String(q.id),
      question: q.question,
      category: q.topic || 'General',
      difficulty,
      time_limit,
    }
  })

const mapEnglishQuestions = (questions: Array<Record<string, any>>) =>
  questions.map((q) => {
    const skill = (q.skill_tested || '').toLowerCase()
    const type = skill === 'comprehension' ? 'reading'
      : skill === 'grammar' || skill === 'vocabulary' || skill === 'listening'
        ? skill
        : 'reading'

    return {
      id: String(q.id),
      type,
      question: q.question,
      options: q.options ?? undefined,
      passage: q.passage ?? undefined,
    }
  })

export const useEvaluationStore = create<EvaluationState>((set) => ({
  // ── CV ──────────────────────────────────────────────────────────
  cvResults: [],
  cvLoading: false,

  submitCV: async (file: File) => {
    set({ cvLoading: true, error: null })
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await api.post('/evaluations/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const evaluationId = uploadRes.data?.id
      const analysisRes = await api.post(`/evaluations/cv/${evaluationId}/analyze`)
      const result = buildEvaluationResult('cv', {
        evaluation: uploadRes.data,
        analysis: analysisRes.data,
        fallbackId: evaluationId ? String(evaluationId) : undefined,
      })
      set((s) => ({ cvResults: [result, ...s.cvResults], cvLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'CV upload failed', cvLoading: false })
      throw e
    }
  },

  fetchCVResults: async () => {
    set({ cvLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/cv/latest'))
    set({ cvResults: res ? [buildEvaluationResult('cv', { evaluation: res.data })] : [], cvLoading: false })
  },

  // ── GitHub ──────────────────────────────────────────────────────
  githubEvaluations: [],
  githubLoading: false,

  evaluateGitHub: async (username: string) => {
    set({ githubLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/github/analyze', { username })
      const result = buildEvaluationResult('github', { analysis: res.data })
      set((s) => ({ githubEvaluations: [result, ...s.githubEvaluations], githubLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'GitHub evaluation failed', githubLoading: false })
      throw e
    }
  },

  fetchGitHubEvaluations: async () => {
    set({ githubLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/github/latest'))
    set({ githubEvaluations: res ? [buildEvaluationResult('github', { evaluation: res.data })] : [], githubLoading: false })
  },

  // ── LinkedIn ────────────────────────────────────────────────────
  linkedinEvaluations: [],
  linkedinLoading: false,

  evaluateLinkedIn: async (profileUrl: string) => {
    set({ linkedinLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/linkedin/analyze', { profile_url: profileUrl })
      const result = buildEvaluationResult('linkedin', { analysis: res.data })
      set((s) => ({ linkedinEvaluations: [result, ...s.linkedinEvaluations], linkedinLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'LinkedIn evaluation failed', linkedinLoading: false })
      throw e
    }
  },

  submitManualLinkedIn: async (data: Record<string, unknown>) => {
    set({ linkedinLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/linkedin/analyze', { manual_data: data })
      const result = buildEvaluationResult('linkedin', { analysis: res.data })
      set((s) => ({ linkedinEvaluations: [result, ...s.linkedinEvaluations], linkedinLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'LinkedIn submission failed', linkedinLoading: false })
      throw e
    }
  },

  fetchLinkedInEvaluations: async () => {
    set({ linkedinLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/linkedin/latest'))
    set({ linkedinEvaluations: res ? [buildEvaluationResult('linkedin', { evaluation: res.data })] : [], linkedinLoading: false })
  },

  // ── Idea ────────────────────────────────────────────────────────
  ideaEvaluations: [],
  ideaLoading: false,

  submitIdea: async (data) => {
    set({ ideaLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/idea/analyze', data)
      const result = buildEvaluationResult('idea', { analysis: res.data })
      set((s) => ({ ideaEvaluations: [result, ...s.ideaEvaluations], ideaLoading: false }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Idea submission failed', ideaLoading: false })
      throw e
    }
  },

  fetchIdeaEvaluations: async () => {
    set({ ideaLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/idea/latest'))
    set({ ideaEvaluations: res ? [buildEvaluationResult('idea', { evaluation: res.data })] : [], ideaLoading: false })
  },

  // ── Interview ───────────────────────────────────────────────────
  interviewResults: [],
  interviewLoading: false,
  currentInterview: null,

  startInterview: async (techStack: string[]) => {
    set({ interviewLoading: true, error: null })
    try {
      const topic = techStack.join(', ')
      const res = await api.post('/evaluations/interview/start', { topic, difficulty: 'intermediate' })
      const questions = Array.isArray(res.data) ? res.data : res.data?.questions || []
      const latest = await safeFetch(() => api.get('/evaluations/interview/latest'))
      const interviewId = latest?.data?.id
      if (!interviewId) {
        throw new Error('Interview session could not be created')
      }
      const mappedQuestions = mapInterviewQuestions(questions)
      const interview = { id: String(interviewId), questions: mappedQuestions }
      set({ currentInterview: interview, interviewLoading: false })
      return interview
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

  completeInterview: async (interviewId: string) => {
    try {
      const res = await api.post(`/evaluations/interview/${interviewId}/complete`)
      const result = buildEvaluationResult('interview', { analysis: res.data, fallbackId: interviewId })
      set((s) => ({ interviewResults: [result, ...s.interviewResults] }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to complete interview' })
      throw e
    }
  },

  fetchInterviewResults: async () => {
    set({ interviewLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/interview/latest'))
    set({ interviewResults: res ? [buildEvaluationResult('interview', { evaluation: res.data })] : [], interviewLoading: false })
  },

  // ── English ─────────────────────────────────────────────────────
  englishResults: [],
  englishLoading: false,
  currentAssessment: null,

  startEnglish: async () => {
    set({ englishLoading: true, error: null })
    try {
      const res = await api.post('/evaluations/english/start', { assessment_type: 'comprehensive' })
      const questions = Array.isArray(res.data) ? res.data : res.data?.questions || []
      const latest = await safeFetch(() => api.get('/evaluations/english/latest'))
      const assessmentId = latest?.data?.id
      if (!assessmentId) {
        throw new Error('Assessment session could not be created')
      }
      const mappedQuestions = mapEnglishQuestions(questions)
      const assessment = { id: String(assessmentId), questions: mappedQuestions }
      set({ currentAssessment: assessment, englishLoading: false })
      return assessment
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

  completeEnglish: async (assessmentId: string) => {
    try {
      const res = await api.post(`/evaluations/english/${assessmentId}/complete`)
      const result = buildEvaluationResult('english', { analysis: res.data, fallbackId: assessmentId })
      set((s) => ({ englishResults: [result, ...s.englishResults] }))
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      set({ error: err.response?.data?.detail || 'Failed to complete assessment' })
      throw e
    }
  },

  fetchEnglishResults: async () => {
    set({ englishLoading: true })
    const res = await safeFetch(() => api.get('/evaluations/english/latest'))
    set({ englishResults: res ? [buildEvaluationResult('english', { evaluation: res.data })] : [], englishLoading: false })
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
