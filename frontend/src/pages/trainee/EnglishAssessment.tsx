import { useState, useEffect } from 'react'
import { useEvaluationStore } from '@/stores/evaluationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Languages,
  Play,
  Clock,
  BookOpen,
  Pencil,
  Headphones,
  MessageCircle,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Question {
  id: string
  type: 'grammar' | 'vocabulary' | 'reading' | 'listening'
  question: string
  options?: string[]
  passage?: string
}

export function EnglishAssessmentPage() {
  const [isAssessmentActive, setIsAssessmentActive] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  
  const {
    englishResults,
    englishLoading,
    currentAssessment,
    startEnglish,
    submitEnglishAnswer,
    completeEnglish,
    fetchEnglishResults,
  } = useEvaluationStore()

  useEffect(() => {
    fetchEnglishResults()
  }, [fetchEnglishResults])

  const handleStartAssessment = async () => {
    try {
      await startEnglish()
      setIsAssessmentActive(true)
      setCurrentQuestionIndex(0)
      setAnswers({})
    } catch {
      toast.error('Failed to start assessment')
    }
  }

  const handleSelectAnswer = async (answer: string) => {
    setSelectedAnswer(answer)
    const questions = currentAssessment?.questions as Question[] || []
    const currentQuestion = questions[currentQuestionIndex]
    
    if (currentQuestion) {
      try {
        await submitEnglishAnswer(currentAssessment!.id, currentQuestion.id, answer)
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
      } catch {
        toast.error('Failed to submit answer')
      }
    }

    // Auto-advance after short delay
    setTimeout(async () => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
        setSelectedAnswer('')
      } else {
        setIsAssessmentActive(false)
        try {
          await completeEnglish(currentAssessment!.id)
          toast.success('Assessment completed!')
        } catch {
          toast.error('Failed to complete assessment')
        }
      }
    }, 500)
  }

  const questions = currentAssessment?.questions as Question[] || []
  const currentQuestion = questions[currentQuestionIndex]
  const latestResult = englishResults[0]
  const details = latestResult?.details as unknown as {
    grammar_score: number
    vocabulary_score: number
    fluency_level: string
    cefr_level: string
    areas_to_improve: string[]
  } | undefined

  const getCefrColor = (level: string) => {
    switch (level) {
      case 'C2': case 'C1': return 'bg-green-500'
      case 'B2': case 'B1': return 'bg-blue-500'
      case 'A2': case 'A1': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'grammar': return <Pencil className="h-4 w-4" />
      case 'vocabulary': return <BookOpen className="h-4 w-4" />
      case 'reading': return <MessageCircle className="h-4 w-4" />
      case 'listening': return <Headphones className="h-4 w-4" />
      default: return <Languages className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">English Proficiency Test</h1>
        <p className="text-muted-foreground">
          Assess your English language skills aligned with CEFR standards
        </p>
      </div>

      {!isAssessmentActive ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Start Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-purple-500" />
                Start Assessment
              </CardTitle>
              <CardDescription>
                Complete a comprehensive English language evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border p-4 text-center">
                  <Pencil className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 font-medium">Grammar</p>
                  <p className="text-sm text-muted-foreground">Sentence structure</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 font-medium">Vocabulary</p>
                  <p className="text-sm text-muted-foreground">Word knowledge</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <MessageCircle className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 font-medium">Reading</p>
                  <p className="text-sm text-muted-foreground">Comprehension</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <Headphones className="mx-auto h-6 w-6 text-muted-foreground" />
                  <p className="mt-2 font-medium">Listening</p>
                  <p className="text-sm text-muted-foreground">Audio comprehension</p>
                </div>
              </div>

              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">Assessment Details</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>- 20-30 multiple choice questions</li>
                  <li>- Covers all CEFR levels (A1-C2)</li>
                  <li>- Takes approximately 15-20 minutes</li>
                  <li>- Instant results with detailed feedback</li>
                </ul>
              </div>

              <Button
                onClick={handleStartAssessment}
                className="w-full"
                loading={englishLoading}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Assessment
              </Button>
            </CardContent>
          </Card>

          {/* Latest Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Latest Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              {latestResult ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                      <p className="text-4xl font-bold text-primary">{latestResult.score}%</p>
                    </div>
                    <Badge className={`${getCefrColor(details?.cefr_level || '')} text-white text-lg px-4 py-1`}>
                      {details?.cefr_level || 'N/A'}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Grammar</span>
                        <span>{details?.grammar_score || 0}%</span>
                      </div>
                      <Progress value={details?.grammar_score || 0} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Vocabulary</span>
                        <span>{details?.vocabulary_score || 0}%</span>
                      </div>
                      <Progress value={details?.vocabulary_score || 0} />
                    </div>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium">Fluency Level</p>
                    <p className="mt-1 text-lg">{details?.fluency_level || 'N/A'}</p>
                  </div>

                  {details?.areas_to_improve && details.areas_to_improve.length > 0 && (
                    <div>
                      <p className="mb-2 text-sm font-medium">Areas to Improve</p>
                      <div className="flex flex-wrap gap-2">
                        {details.areas_to_improve.map((area, i) => (
                          <Badge key={i} variant="outline">{area}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="text-right text-sm text-muted-foreground">
                    {formatDate(latestResult.created_at)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No assessments yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start your first English assessment
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Assessment In Progress */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                {currentQuestion && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getTypeIcon(currentQuestion.type)}
                    {currentQuestion.type}
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={(currentQuestionIndex / questions.length) * 100} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion && (
              <>
                {currentQuestion.passage && (
                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Read the passage:</p>
                    <p className="text-sm leading-relaxed">{currentQuestion.passage}</p>
                  </div>
                )}

                <div className="rounded-lg border p-6">
                  <p className="text-lg">{currentQuestion.question}</p>
                </div>

                <div className="grid gap-3">
                  {currentQuestion.options?.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(option)}
                      className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                        selectedAnswer === option
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50 hover:bg-muted/50'
                      }`}
                    >
                      {selectedAnswer === option ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                      <span>{option}</span>
                    </button>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAssessmentActive(false)
                      toast.info('Assessment cancelled')
                    }}
                  >
                    End Assessment
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assessment History */}
      {englishResults.length > 0 && !isAssessmentActive && (
        <Card>
          <CardHeader>
            <CardTitle>Assessment History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {englishResults.map((result) => {
                  const resultDetails = result.details as unknown as { cefr_level?: string } | undefined
                  return (
                    <div
                      key={result.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                          <Languages className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium">English Assessment</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(result.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`${getCefrColor(resultDetails?.cefr_level || '')} text-white`}>
                          {resultDetails?.cefr_level || 'N/A'}
                        </Badge>
                        <Badge variant={result.score >= 70 ? 'success' : result.score >= 50 ? 'warning' : 'destructive'}>
                          {result.score}%
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
