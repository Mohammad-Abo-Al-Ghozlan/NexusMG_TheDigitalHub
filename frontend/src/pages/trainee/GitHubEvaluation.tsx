import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEvaluationStore } from '@/stores/evaluationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Github,
  Star,
  GitFork,
  Code2,
  Activity,
  Clock,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Users,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const githubSchema = z.object({
  username: z.string().min(1, 'GitHub username is required'),
})

type GitHubForm = z.infer<typeof githubSchema>

export function GitHubEvaluationPage() {
  const { githubEvaluations, githubLoading, evaluateGitHub, fetchGitHubEvaluations, error } = useEvaluationStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GitHubForm>({
    resolver: zodResolver(githubSchema),
  })

  useEffect(() => {
    fetchGitHubEvaluations()
  }, [fetchGitHubEvaluations])

  const onSubmit = async (data: GitHubForm) => {
    try {
      await evaluateGitHub(data.username)
      toast.success('GitHub profile evaluated successfully!')
    } catch {
      toast.error(error || 'Failed to evaluate GitHub profile')
    }
  }

  const latestEvaluation = githubEvaluations[0]
  const details = latestEvaluation?.details as unknown as {
    total_repos: number
    total_stars: number
    languages: Record<string, number>
    commit_frequency: number
    code_quality_score: number
    contributions_last_year: number
  } | undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">GitHub Analysis</h1>
        <p className="text-muted-foreground">
          Analyze your GitHub profile for coding activity and quality metrics
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              Analyze Profile
            </CardTitle>
            <CardDescription>
              Enter your GitHub username to start the analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">GitHub Username</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      github.com/
                    </span>
                    <Input
                      id="username"
                      placeholder="username"
                      className="pl-24"
                      {...register('username')}
                    />
                  </div>
                  <Button type="submit" loading={githubLoading}>
                    Analyze
                  </Button>
                </div>
                {errors.username && (
                  <p className="text-sm text-destructive">{errors.username.message}</p>
                )}
              </div>
            </form>

            {/* Quick Stats Grid */}
            {latestEvaluation && details && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-muted p-4 text-center">
                  <Code2 className="mx-auto h-6 w-6 text-primary" />
                  <p className="mt-2 text-2xl font-bold">{details.total_repos}</p>
                  <p className="text-sm text-muted-foreground">Repositories</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <Star className="mx-auto h-6 w-6 text-yellow-500" />
                  <p className="mt-2 text-2xl font-bold">{details.total_stars}</p>
                  <p className="text-sm text-muted-foreground">Total Stars</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <Activity className="mx-auto h-6 w-6 text-green-500" />
                  <p className="mt-2 text-2xl font-bold">{details.contributions_last_year}</p>
                  <p className="text-sm text-muted-foreground">Contributions</p>
                </div>
                <div className="rounded-lg bg-muted p-4 text-center">
                  <TrendingUp className="mx-auto h-6 w-6 text-blue-500" />
                  <p className="mt-2 text-2xl font-bold">{details.commit_frequency}</p>
                  <p className="text-sm text-muted-foreground">Commits/Week</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Score Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Latest Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {latestEvaluation ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className="text-4xl font-bold text-primary">{latestEvaluation.score}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Evaluated on</p>
                    <p className="font-medium">{formatDate(latestEvaluation.created_at)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Code Quality</span>
                      <span>{details?.code_quality_score || 0}%</span>
                    </div>
                    <Progress value={details?.code_quality_score || 0} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Activity Level</span>
                      <span>{Math.min(100, (details?.commit_frequency || 0) * 10)}%</span>
                    </div>
                    <Progress value={Math.min(100, (details?.commit_frequency || 0) * 10)} />
                  </div>
                </div>

                {/* Languages */}
                {details?.languages && (
                  <div>
                    <p className="mb-2 text-sm font-medium">Top Languages</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(details.languages)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 6)
                        .map(([lang, percent]) => (
                          <Badge key={lang} variant="secondary">
                            {lang}: {percent}%
                          </Badge>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No evaluations yet</p>
                <p className="text-sm text-muted-foreground">
                  Enter your GitHub username to get started
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Feedback */}
      {latestEvaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="feedback">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="strengths">Strengths</TabsTrigger>
                <TabsTrigger value="improvements">Improvements</TabsTrigger>
              </TabsList>

              <TabsContent value="feedback" className="mt-4">
                <ScrollArea className="h-64">
                  <div className="space-y-4 pr-4">
                    <p className="text-sm leading-relaxed">{latestEvaluation.feedback}</p>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="strengths" className="mt-4">
                <ScrollArea className="h-64">
                  <div className="space-y-3 pr-4">
                    {latestEvaluation.strengths.map((strength, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                        <p className="text-sm text-green-900">{strength}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="improvements" className="mt-4">
                <ScrollArea className="h-64">
                  <div className="space-y-3 pr-4">
                    {latestEvaluation.improvements.map((improvement, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-lg bg-amber-50 p-3">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <p className="text-sm text-amber-900">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {githubEvaluations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluation History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {githubEvaluations.slice(1).map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                      <Github className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">GitHub Analysis</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(evaluation.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={evaluation.score >= 70 ? 'success' : evaluation.score >= 50 ? 'warning' : 'destructive'}>
                    {evaluation.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
