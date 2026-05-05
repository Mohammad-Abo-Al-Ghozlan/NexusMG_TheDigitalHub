import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useEvaluationStore } from '@/stores/evaluationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Github,
  Linkedin,
  Lightbulb,
  MessageSquare,
  Languages,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react'

const modules = [
  {
    id: 'cv',
    title: 'CV Evaluation',
    description: 'Upload your resume for AI analysis',
    icon: FileText,
    href: '/dashboard/cv',
    color: 'text-[#6C63FF]',
    bgColor: 'bg-[#6C63FF15]',
  },
  {
    id: 'github',
    title: 'GitHub Analysis',
    description: 'Evaluate your coding activity',
    icon: Github,
    href: '/dashboard/github',
    color: 'text-[#F0F0FF]',
    bgColor: 'bg-[#F0F0FF10]',
  },
  {
    id: 'linkedin',
    title: 'LinkedIn Review',
    description: 'Optimize your professional profile',
    icon: Linkedin,
    href: '/dashboard/linkedin',
    color: 'text-[#00D4FF]',
    bgColor: 'bg-[#00D4FF15]',
  },
  {
    id: 'idea',
    title: 'Idea Pitch',
    description: 'Validate your project ideas',
    icon: Lightbulb,
    href: '/dashboard/idea',
    color: 'text-[#FFB830]',
    bgColor: 'bg-[#FFB83015]',
  },
  {
    id: 'interview',
    title: 'Mock Interview',
    description: 'Practice technical interviews',
    icon: MessageSquare,
    href: '/dashboard/interview',
    color: 'text-[#00C896]',
    bgColor: 'bg-[#00C89615]',
  },
  {
    id: 'english',
    title: 'English Test',
    description: 'Assess language proficiency',
    icon: Languages,
    href: '/dashboard/english',
    color: 'text-[#6C63FF]',
    bgColor: 'bg-[#6C63FF15]',
  },
]

export function TraineeDashboard() {
  const { user } = useAuthStore()
  const { readinessScore, fetchReadinessScore, readinessLoading } = useEvaluationStore()

  useEffect(() => {
    fetchReadinessScore()
  }, [fetchReadinessScore])

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-[#00C896]'
    if (score >= 50) return 'text-[#FFB830]'
    if (score >= 25) return 'text-[#FF4D6D]'
    return 'text-[#FF4D6D]'
  }

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'expert':
        return <Badge variant="success">Expert</Badge>
      case 'advanced':
        return <Badge className="bg-[#00D4FF] text-white">Advanced</Badge>
      case 'intermediate':
        return <Badge variant="warning">Intermediate</Badge>
      default:
        return <Badge variant="secondary">Beginner</Badge>
    }
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-[#F0F0FF]">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
        <p className="mt-2 text-[#8888AA]">
          Track your progress and complete evaluations to improve your developer readiness score.
        </p>
      </div>

      {/* Readiness Score Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <div className="h-0.5 w-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF]" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#6C63FF]" />
              Overall Readiness Score
            </CardTitle>
            <CardDescription>Your combined score across all modules</CardDescription>
          </CardHeader>
          <CardContent>
            {readinessLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-32 w-32 rounded-full skeleton" />
              </div>
            ) : readinessScore ? (
              <div className="flex items-center gap-8">
                <div className="relative flex h-32 w-32 items-center justify-center">
                  <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 128 128">
                    <circle cx="64" cy="64" r="56" stroke="#1E1E2E" strokeWidth="12" fill="none" />
                    <circle
                      cx="64" cy="64" r="56"
                      stroke="url(#dashGradient)"
                      strokeWidth="12" fill="none"
                      strokeDasharray={`${(readinessScore.overall / 100) * 352} 352`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="dashGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6C63FF" />
                        <stop offset="100%" stopColor="#00D4FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute text-center">
                    <span className={`text-3xl font-bold font-score ${getScoreColor(readinessScore.overall)}`}>
                      {readinessScore.overall.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#8888AA]">Level</span>
                    {getLevelBadge(readinessScore.level)}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(readinessScore.modules).map(([key, value]) => (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize text-[#8888AA]">{key}</span>
                          <span className="font-medium font-score text-[#F0F0FF]">{value.toFixed(2)}%</span>
                        </div>
                        <Progress value={value} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="mb-4 h-12 w-12 text-[#44445A]" />
                <p className="text-lg font-medium text-[#F0F0FF]">No evaluations yet</p>
                <p className="text-sm text-[#8888AA]">Complete your first evaluation to see your score</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-[#00C896]" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-3">
              <span className="text-sm text-[#8888AA]">Modules Completed</span>
              <span className="text-lg font-bold font-score text-[#F0F0FF]">
                {readinessScore ? Object.values(readinessScore.modules).filter(v => v > 0).length : 0}/6
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-3">
              <span className="text-sm text-[#8888AA]">Best Score</span>
              <span className="text-lg font-bold font-score text-[#00C896]">
                {readinessScore ? Math.max(...Object.values(readinessScore.modules)) : 0}%
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-3">
              <span className="text-sm text-[#8888AA]">Needs Work</span>
              <span className="text-lg font-bold font-score text-[#FFB830]">
                {readinessScore 
                  ? Object.entries(readinessScore.modules)
                      .filter(([, v]) => v > 0 && v < 50)
                      .length 
                  : 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluation Modules Grid */}
      <div>
        <h2 className="mb-4 text-xl font-semibold text-[#F0F0FF]">Evaluation Modules</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
          {modules.map((module) => {
            const score = readinessScore?.modules[module.id as keyof typeof readinessScore.modules]
            const isCompleted = score !== undefined && score > 0
            
            return (
              <Card key={module.id} className="group transition-all duration-300 hover:shadow-[0_0_25px_#6C63FF15] hover:border-[#6C63FF30]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl p-2.5 ${module.bgColor} transition-all group-hover:shadow-[0_0_15px_rgba(108,99,255,0.1)]`}>
                      <module.icon className={`h-5 w-5 ${module.color}`} />
                    </div>
                    {isCompleted && (
                      <Badge variant="outline" className="border-[#00C89640] bg-[#00C89610] text-[#00C896] font-score">
                        {score}%
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Link to={module.href}>
                    <Button variant={isCompleted ? "outline" : "default"} className="w-full gap-2">
                      {isCompleted ? 'View Results' : 'Start Evaluation'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
