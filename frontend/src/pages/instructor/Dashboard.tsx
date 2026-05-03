import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { instructorApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  UserPlus,
  Clock,
} from 'lucide-react'

interface Analytics {
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
  recentEvaluations: Array<{
    id: string
    trainee_name: string
    module: string
    score: number
    created_at: string
  }>
}

interface Trainee {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  readiness_score: number
  last_active: string
  status: 'improving' | 'stable' | 'needs_attention'
}

export function InstructorDashboard() {
  const { user } = useAuthStore()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [trainees, setTrainees] = useState<Trainee[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, traineesRes] = await Promise.all([
          instructorApi.getAnalytics(),
          instructorApi.getTrainees(),
        ])
        setAnalytics(analyticsRes.data)
        setTrainees(traineesRes.data)
      } catch (error) {
        console.error('Failed to fetch instructor data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'improving':
        return <Badge variant="success">Improving</Badge>
      case 'needs_attention':
        return <Badge variant="destructive">Needs Attention</Badge>
      default:
        return <Badge variant="secondary">Stable</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Welcome back, {user?.full_name}. Monitor your trainees&apos; progress.
          </p>
        </div>
        <Link to="/instructor/trainees">
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Trainee
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Trainees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalTrainees || 0}</div>
            <p className="text-xs text-muted-foreground">Active in your program</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Readiness</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.averageReadiness || 0}%</div>
            <Progress value={analytics?.averageReadiness || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Improving</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {analytics?.traineesProgress?.improving || 0}
            </div>
            <p className="text-xs text-muted-foreground">Trainees on track</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">
              {analytics?.traineesProgress?.needsAttention || 0}
            </div>
            <p className="text-xs text-muted-foreground">Require follow-up</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Module Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Module Performance
            </CardTitle>
            <CardDescription>Average scores across all trainees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics?.moduleAverages && Object.entries(analytics.moduleAverages).map(([module, score]) => (
              <div key={module} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{module}</span>
                  <span className="font-medium">{score}%</span>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Evaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Evaluations
            </CardTitle>
            <CardDescription>Latest trainee submissions</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.recentEvaluations && analytics.recentEvaluations.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentEvaluations.slice(0, 5).map((evaluation) => (
                  <div
                    key={evaluation.id}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <p className="font-medium">{evaluation.trainee_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {evaluation.module} Evaluation
                      </p>
                    </div>
                    <Badge variant={evaluation.score >= 70 ? 'success' : evaluation.score >= 50 ? 'warning' : 'destructive'}>
                      {evaluation.score}%
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent evaluations
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trainees List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Trainees</CardTitle>
            <CardDescription>Monitor individual progress</CardDescription>
          </div>
          <Link to="/instructor/trainees">
            <Button variant="outline" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {trainees.length > 0 ? (
            <div className="space-y-4">
              {trainees.slice(0, 5).map((trainee) => (
                <Link
                  key={trainee.id}
                  to={`/instructor/trainees/${trainee.id}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={trainee.avatar_url} />
                      <AvatarFallback>
                        {trainee.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{trainee.full_name}</p>
                      <p className="text-sm text-muted-foreground">{trainee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">{trainee.readiness_score}%</p>
                      <p className="text-xs text-muted-foreground">Readiness</p>
                    </div>
                    {getStatusBadge(trainee.status)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No trainees yet</p>
              <p className="text-sm text-muted-foreground">
                Invite trainees to start monitoring their progress
              </p>
              <Link to="/instructor/trainees">
                <Button className="mt-4">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Trainees
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
