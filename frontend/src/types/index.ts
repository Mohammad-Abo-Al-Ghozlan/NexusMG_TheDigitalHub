export interface User {
  id: string
  email: string
  full_name: string
  role: 'trainee' | 'instructor' | 'admin'
  avatar_url?: string
  created_at: string
  updated_at?: string
  email_verified?: boolean
  auth_provider?: string
}

export interface Trainee extends User {
  role: 'trainee'
  instructor_id?: string
  batch?: string
  enrollment_date?: string
}

export interface Instructor extends User {
  role: 'instructor'
  department?: string
  trainees_count?: number
}

export interface EvaluationResult {
  id: string
  user_id: string
  module: EvaluationModule
  score: number
  feedback: string
  strengths: string[]
  improvements: string[]
  details?: Record<string, unknown>
  created_at: string
}

export type EvaluationModule = 
  | 'cv'
  | 'github'
  | 'linkedin'
  | 'idea'
  | 'interview'
  | 'english'

export interface CVEvaluation extends EvaluationResult {
  module: 'cv'
  details: {
    skills_found: string[]
    experience_years: number
    education: string[]
    formatting_score: number
    ats_compatibility: number
  }
}

export interface GitHubEvaluation extends EvaluationResult {
  module: 'github'
  details: {
    total_repos: number
    total_stars: number
    languages: { [key: string]: number }
    commit_frequency: number
    code_quality_score: number
    contributions_last_year: number
  }
}

export interface LinkedInEvaluation extends EvaluationResult {
  module: 'linkedin'
  details: {
    profile_completeness: number
    headline_score: number
    summary_score: number
    experience_count: number
    skills_count: number
    recommendations_count: number
    network_size: string
  }
}

export interface IdeaEvaluation extends EvaluationResult {
  module: 'idea'
  details: {
    innovation_score: number
    feasibility_score: number
    market_potential: number
    technical_complexity: string
    suggested_improvements: string[]
  }
}

export interface InterviewResult extends EvaluationResult {
  module: 'interview'
  details: {
    questions_answered: number
    total_questions: number
    average_response_time: number
    technical_accuracy: number
    communication_score: number
    problem_solving_score: number
  }
}

export interface EnglishResult extends EvaluationResult {
  module: 'english'
  details: {
    grammar_score: number
    vocabulary_score: number
    fluency_level: string
    cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    areas_to_improve: string[]
  }
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
  lastUpdated: string
}

export interface InstructorAnalytics {
  totalTrainees: number
  averageReadiness: number
  moduleAverages: {
    cv: number
    github: number
    linkedin: number
    idea: number
    interview: number
    english: number
  }
  traineesProgress: {
    improving: number
    stable: number
    needsAttention: number
  }
  recentEvaluations: EvaluationResult[]
}

export interface InterviewQuestion {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_limit: number
}

export interface EnglishQuestion {
  id: string
  type: 'grammar' | 'vocabulary' | 'reading' | 'listening'
  question: string
  options?: string[]
  audio_url?: string
  passage?: string
  time_limit: number
}
