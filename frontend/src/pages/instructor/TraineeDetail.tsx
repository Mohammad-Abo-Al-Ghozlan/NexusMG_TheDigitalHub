import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { instructorApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Download,
  FileText,
  Github,
  Linkedin,
  Lightbulb,
  MessageSquare,
  Languages,
  TrendingUp,
  Calendar,
  Mail,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TraineeDetail {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  created_at: string
  last_active: string
  readiness_score: number
  status: 'improving' | 'stable' | 'needs_attention'
  modules: {
    cv: number
    github: number
    linkedin: number
    idea: number
    interview: number
    english: number
  }
  evaluations: Array<{
    id: string
    module: string
    score: number
    feedback: string
    created_at: string
  }>
  progress_history: Array<{
    date: string
    score: number
  }>
}

const moduleIcons: Record<string, React.ElementType> = {
  cv: FileText,
  github: Github,
  linkedin: Linkedin,
  idea: Lightbulb,
  interview: MessageSquare,
  english: Languages,
}

export function TraineeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [trainee, setTrainee] = useState<TraineeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTrainee()
    }
  }, [id])

  const fetchTrainee = async () => {
    try {
      const response = await instructorApi.getTraineeDetails(id!)
      setTrainee(response.data)
    } catch (error) {
      console.error('Failed to fetch trainee:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'csv') => {
    setIsExporting(true)
    try {
      const response = await instructorApi.exportReport(id!, format)
      // response.data is already a Blob because of responseType: 'blob' in api.ts
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${trainee?.full_name?.replace(/\s+/g, '_') || 'trainee'}_report.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      console.error('Export failed:', error)
      toast.error(error.response?.data?.detail || 'Failed to export report')
    } finally {
      setIsExporting(false)
    }
  }

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

  if (!trainee) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-medium">Trainee not found</h2>
        <Link to="/instructor/trainees">
          <Button variant="link">Back to Trainees</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/instructor/trainees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={trainee.avatar_url} />
              <AvatarFallback className="text-xl">
                {trainee.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'TR'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{trainee.full_name}</h1>
                {getStatusBadge(trainee.status)}
              </div>
              <p className="text-muted-foreground">{trainee.email}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport('csv')} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => handleExport('pdf')} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trainee.readiness_score}%</p>
                <p className="text-sm text-muted-foreground">Readiness Score</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trainee.evaluations.length}</p>
                <p className="text-sm text-muted-foreground">Evaluations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{formatDate(trainee.created_at)}</p>
                <p className="text-sm text-muted-foreground">Joined</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Mail className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">{formatDate(trainee.last_active)}</p>
                <p className="text-sm text-muted-foreground">Last Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Module Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Module Performance</CardTitle>
            <CardDescription>Scores across all evaluation modules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(trainee.modules).map(([module, score]) => {
              const Icon = moduleIcons[module] || FileText
              return (
                <div key={module} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{module}</span>
                      <span className={score >= 70 ? 'text-green-600' : score >= 50 ? 'text-yellow-600' : 'text-red-600'}>
                        {score}%
                      </span>
                    </div>
                    <Progress value={score} className="mt-1 h-2" />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Progress Chart Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Progress Over Time</CardTitle>
            <CardDescription>Readiness score history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              {trainee.progress_history.length > 0 ? (
                <div className="w-full space-y-2">
                  {trainee.progress_history.slice(-7).map((point, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs w-20 text-muted-foreground">{formatDate(point.date)}</span>
                      <div className="flex-1 h-4 bg-muted rounded">
                        <div 
                          className="h-4 bg-primary rounded" 
                          style={{ width: `${point.score}%` }}
                        />
                      </div>
                      <span className="text-xs w-10 text-right">{point.score}%</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No progress data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evaluation History */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation History</CardTitle>
          <CardDescription>All completed evaluations</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cv">CV</TabsTrigger>
              <TabsTrigger value="github">GitHub</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
              <TabsTrigger value="idea">Idea</TabsTrigger>
              <TabsTrigger value="interview">Interview</TabsTrigger>
              <TabsTrigger value="english">English</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {trainee.evaluations.map((evaluation) => {
                    const Icon = moduleIcons[evaluation.module] || FileText
                    return (
                      <div
                        key={evaluation.id}
                        className="flex items-start gap-4 rounded-lg border p-4"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium capitalize">{evaluation.module} Evaluation</p>
                            <Badge variant={evaluation.score >= 70 ? 'success' : evaluation.score >= 50 ? 'warning' : 'destructive'}>
                              {evaluation.score}%
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                            {evaluation.feedback}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {formatDate(evaluation.created_at)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            </TabsContent>

            {['cv', 'github', 'linkedin', 'idea', 'interview', 'english'].map(module => (
              <TabsContent key={module} value={module} className="mt-4">
                <ScrollArea className="h-80">
                  <div className="space-y-3">
                    {trainee.evaluations
                      .filter(e => e.module === module)
                      .map((evaluation) => {
                        const Icon = moduleIcons[evaluation.module] || FileText
                        return (
                          <div
                            key={evaluation.id}
                            className="flex items-start gap-4 rounded-lg border p-4"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                              <Icon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium capitalize">{evaluation.module} Evaluation</p>
                                <Badge variant={evaluation.score >= 70 ? 'success' : evaluation.score >= 50 ? 'warning' : 'destructive'}>
                                  {evaluation.score}%
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {evaluation.feedback}
                              </p>
                              <p className="mt-2 text-xs text-muted-foreground">
                                {formatDate(evaluation.created_at)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    {trainee.evaluations.filter(e => e.module === module).length === 0 && (
                      <p className="py-8 text-center text-muted-foreground">
                        No {module} evaluations yet
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
