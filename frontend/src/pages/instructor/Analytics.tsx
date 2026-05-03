import { useEffect, useState } from 'react'
import { instructorApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
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
  weeklyActivity: {
    evaluationsCompleted: number
    averageScore: number
    topPerformers: number
  }
  distribution: {
    beginner: number
    intermediate: number
    advanced: number
    expert: number
  }
}

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await instructorApi.getAnalytics()
      setAnalytics(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalProgress = analytics ? 
    analytics.traineesProgress.improving + 
    analytics.traineesProgress.stable + 
    analytics.traineesProgress.needsAttention : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Comprehensive insights into your training program
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Trainees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalTrainees || 0}</div>
            <p className="text-xs text-muted-foreground">Enrolled in your program</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Readiness</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.averageReadiness || 0}%</div>
            <Progress value={analytics?.averageReadiness || 0} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weekly Evaluations</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.weeklyActivity?.evaluationsCompleted || 0}</div>
            <p className="text-xs text-muted-foreground">Completed this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{analytics?.weeklyActivity?.topPerformers || 0}</div>
            <p className="text-xs text-muted-foreground">{"Score > 80%"}</p>
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
            <CardDescription>Average scores by evaluation module</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics?.moduleAverages && Object.entries(analytics.moduleAverages)
              .sort(([, a], [, b]) => b - a)
              .map(([module, score]) => (
                <div key={module} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{module}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        score >= 70 ? 'text-green-500' : 
                        score >= 50 ? 'text-yellow-500' : 'text-red-500'
                      }`}>
                        {score}%
                      </span>
                      {score >= 70 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : score < 50 ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  <Progress value={score} className="h-3" />
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Trainee Progress Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Progress Distribution
            </CardTitle>
            <CardDescription>Trainee status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Visual Bars */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium">Improving</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {analytics?.traineesProgress?.improving || 0} trainees
                    </span>
                  </div>
                  <Progress 
                    value={totalProgress > 0 ? ((analytics?.traineesProgress?.improving || 0) / totalProgress) * 100 : 0} 
                    className="h-3 [&>div]:bg-green-500" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-400" />
                      <span className="text-sm font-medium">Stable</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {analytics?.traineesProgress?.stable || 0} trainees
                    </span>
                  </div>
                  <Progress 
                    value={totalProgress > 0 ? ((analytics?.traineesProgress?.stable || 0) / totalProgress) * 100 : 0} 
                    className="h-3 [&>div]:bg-gray-400" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm font-medium">Needs Attention</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {analytics?.traineesProgress?.needsAttention || 0} trainees
                    </span>
                  </div>
                  <Progress 
                    value={totalProgress > 0 ? ((analytics?.traineesProgress?.needsAttention || 0) / totalProgress) * 100 : 0} 
                    className="h-3 [&>div]:bg-red-500" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Readiness Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Readiness Level Distribution</CardTitle>
          <CardDescription>Trainees categorized by their overall readiness level</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-red-500">{analytics?.distribution?.beginner || 0}</div>
              <Badge variant="outline" className="mt-2">Beginner</Badge>
              <p className="mt-1 text-xs text-muted-foreground">{"0-25%"}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-yellow-500">{analytics?.distribution?.intermediate || 0}</div>
              <Badge variant="outline" className="mt-2">Intermediate</Badge>
              <p className="mt-1 text-xs text-muted-foreground">{"25-50%"}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-blue-500">{analytics?.distribution?.advanced || 0}</div>
              <Badge variant="outline" className="mt-2">Advanced</Badge>
              <p className="mt-1 text-xs text-muted-foreground">{"50-75%"}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <div className="text-3xl font-bold text-green-500">{analytics?.distribution?.expert || 0}</div>
              <Badge variant="outline" className="mt-2">Expert</Badge>
              <p className="mt-1 text-xs text-muted-foreground">{"75-100%"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>AI-generated recommendations based on analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {analytics?.moduleAverages && (
              <>
                <div className="rounded-lg bg-green-50 p-4">
                  <h4 className="font-medium text-green-800">Strongest Module</h4>
                  <p className="mt-1 text-sm text-green-700">
                    {Object.entries(analytics.moduleAverages)
                      .sort(([, a], [, b]) => b - a)[0]?.[0]?.toUpperCase() || 'N/A'} with an average score of{' '}
                    {Object.entries(analytics.moduleAverages)
                      .sort(([, a], [, b]) => b - a)[0]?.[1] || 0}%
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-4">
                  <h4 className="font-medium text-red-800">Needs Improvement</h4>
                  <p className="mt-1 text-sm text-red-700">
                    {Object.entries(analytics.moduleAverages)
                      .sort(([, a], [, b]) => a - b)[0]?.[0]?.toUpperCase() || 'N/A'} has the lowest average at{' '}
                    {Object.entries(analytics.moduleAverages)
                      .sort(([, a], [, b]) => a - b)[0]?.[1] || 0}%
                  </p>
                </div>
              </>
            )}
            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="font-medium text-blue-800">Activity Trend</h4>
              <p className="mt-1 text-sm text-blue-700">
                {analytics?.weeklyActivity?.evaluationsCompleted || 0} evaluations completed this week
                with an average score of {analytics?.weeklyActivity?.averageScore || 0}%
              </p>
            </div>
            <div className="rounded-lg bg-purple-50 p-4">
              <h4 className="font-medium text-purple-800">Attention Required</h4>
              <p className="mt-1 text-sm text-purple-700">
                {analytics?.traineesProgress?.needsAttention || 0} trainees need follow-up.
                Consider scheduling one-on-one sessions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
