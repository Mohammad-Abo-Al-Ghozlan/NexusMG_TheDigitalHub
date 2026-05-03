import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEvaluationStore } from '@/stores/evaluationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Lightbulb,
  CheckCircle2,
  Clock,
  TrendingUp,
  Rocket,
  Target,
  Cog,
  Sparkles,
  X,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'

const ideaSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  techStack: z.string().min(1, 'Please add at least one technology'),
})

type IdeaForm = z.infer<typeof ideaSchema>

const suggestedTech = ['React', 'Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'TypeScript']

export function IdeaEvaluationPage() {
  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const { ideaEvaluations, ideaLoading, submitIdea, fetchIdeaEvaluations, error } = useEvaluationStore()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<IdeaForm>({
    resolver: zodResolver(ideaSchema),
  })

  useEffect(() => {
    fetchIdeaEvaluations()
  }, [fetchIdeaEvaluations])

  useEffect(() => {
    setValue('techStack', selectedTech.join(', '))
  }, [selectedTech, setValue])

  const toggleTech = (tech: string) => {
    setSelectedTech(prev =>
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    )
  }

  const onSubmit = async (data: IdeaForm) => {
    try {
      await submitIdea({
        title: data.title,
        description: data.description,
        tech_stack: selectedTech.length > 0 ? selectedTech : data.techStack.split(',').map(t => t.trim()),
      })
      toast.success('Idea evaluated successfully!')
      reset()
      setSelectedTech([])
    } catch {
      toast.error(error || 'Failed to evaluate idea')
    }
  }

  const latestEvaluation = ideaEvaluations[0]
  const details = latestEvaluation?.details as unknown as {
    innovation_score: number
    feasibility_score: number
    market_potential: number
    technical_complexity: string
    suggested_improvements: string[]
  } | undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Idea Pitch Evaluation</h1>
        <p className="text-muted-foreground">
          Submit your project idea for AI analysis and validation
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Submit Your Idea
            </CardTitle>
            <CardDescription>
              Describe your project idea for AI evaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Project Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., AI-Powered Task Management App"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your idea in detail. Include the problem it solves, target audience, key features, and what makes it unique..."
                  rows={6}
                  {...register('description')}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Tech Stack</Label>
                <div className="flex flex-wrap gap-2">
                  {suggestedTech.map(tech => (
                    <Badge
                      key={tech}
                      variant={selectedTech.includes(tech) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleTech(tech)}
                    >
                      {tech}
                      {selectedTech.includes(tech) && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Or type custom technologies, comma-separated"
                  {...register('techStack')}
                  className="mt-2"
                />
                {errors.techStack && (
                  <p className="text-sm text-destructive">{errors.techStack.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" loading={ideaLoading}>
                <Rocket className="mr-2 h-4 w-4" />
                Evaluate Idea
              </Button>
            </form>
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
                  <Badge variant={
                    details?.technical_complexity === 'High' ? 'destructive' :
                    details?.technical_complexity === 'Medium' ? 'warning' : 'secondary'
                  }>
                    {details?.technical_complexity || 'N/A'} Complexity
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <Sparkles className="mx-auto h-6 w-6 text-purple-500" />
                    <p className="mt-2 text-2xl font-bold">{details?.innovation_score || 0}%</p>
                    <p className="text-xs text-muted-foreground">Innovation</p>
                  </div>
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <Cog className="mx-auto h-6 w-6 text-blue-500" />
                    <p className="mt-2 text-2xl font-bold">{details?.feasibility_score || 0}%</p>
                    <p className="text-xs text-muted-foreground">Feasibility</p>
                  </div>
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <Target className="mx-auto h-6 w-6 text-green-500" />
                    <p className="mt-2 text-2xl font-bold">{details?.market_potential || 0}%</p>
                    <p className="text-xs text-muted-foreground">Market</p>
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  Evaluated on {formatDate(latestEvaluation.created_at)}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No evaluations yet</p>
                <p className="text-sm text-muted-foreground">
                  Submit your first idea to get started
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
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
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

              <TabsContent value="suggestions" className="mt-4">
                <ScrollArea className="h-64">
                  <div className="space-y-3 pr-4">
                    {(details?.suggested_improvements || latestEvaluation.improvements).map((suggestion, index) => (
                      <div key={index} className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <p className="text-sm text-blue-900">{suggestion}</p>
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
      {ideaEvaluations.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Previous Ideas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ideaEvaluations.slice(1).map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                      <Lightbulb className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Idea Pitch</p>
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
