import { useState, useEffect, useCallback } from 'react'
import { useEvaluationStore } from '@/stores/evaluationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  MessageSquare,
  Play,
  Clock,
  CheckCircle2,
  AlertCircle,
  Timer,
  Code,
  Brain,
  Target,
  X,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const techOptions = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
  'SQL', 'MongoDB', 'AWS', 'Docker', 'System Design', 'Data Structures'
]

interface Question {
  id: string
  question: string
  category: string
  difficulty: 'easy' | 'medium' | 'hard'
  time_limit: number
}

export function InterviewPage() {
  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const [isInterviewActive, setIsInterviewActive] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isAdvancing, setIsAdvancing] = useState(false)
  
  const {
    interviewResults,
    interviewLoading,
    currentInterview,
    startInterview,
    submitInterviewAnswer,
    completeInterview,
    fetchInterviewResults,
  } = useEvaluationStore()

  const advanceQuestion = useCallback(async (reason: 'manual' | 'timeout' = 'manual') => {
    if (!currentInterview || isAdvancing) return

    setIsAdvancing(true)
    const questions = currentInterview?.questions as Question[] || []
    const currentQuestion = questions[currentQuestionIndex]
    
    try {
      if (currentQuestion && answer.trim()) {
        await submitInterviewAnswer(currentInterview.id, currentQuestion.id, answer)
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }))
      } else if (reason === 'timeout') {
        toast.info('Time is up — moving to the next question')
      }

      setAnswer('')
      
      if (currentQuestionIndex < questions.length - 1) {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        setTimeLeft(questions[nextIndex].time_limit)
      } else {
        setIsInterviewActive(false)
        try {
          await completeInterview(currentInterview.id)
          toast.success('Interview completed! Check your results.')
        } catch {
          toast.error('Failed to complete interview')
        }
      }
    } catch {
      toast.error('Failed to submit answer')
    } finally {
      setIsAdvancing(false)
    }
  }, [answer, completeInterview, currentInterview, currentQuestionIndex, isAdvancing, submitInterviewAnswer])

  useEffect(() => {
    fetchInterviewResults()
  }, [fetchInterviewResults])

  useEffect(() => {
    if (!isInterviewActive || isAdvancing || timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(prev - 1, 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [isInterviewActive, isAdvancing, timeLeft])

  useEffect(() => {
    if (!isInterviewActive || isAdvancing || timeLeft !== 0) return
    void advanceQuestion('timeout')
  }, [isInterviewActive, isAdvancing, timeLeft, advanceQuestion])

  const toggleTech = (tech: string) => {
    setSelectedTech(prev =>
      prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
    )
  }

  const handleStartInterview = async () => {
    if (selectedTech.length === 0) {
      toast.error('Please select at least one technology')
      return
    }

    try {
      const interview = await startInterview(selectedTech)
      setIsInterviewActive(true)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setAnswer('')
      setIsAdvancing(false)
      const questions = interview.questions as Question[]
      if (questions.length > 0) {
        setTimeLeft(questions[0].time_limit)
      }
    } catch {
      toast.error('Failed to start interview')
    }
  }


  const questions = currentInterview?.questions as Question[] || []
  const currentQuestion = questions[currentQuestionIndex]
  const latestResult = interviewResults[0]

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700'
      case 'medium': return 'bg-yellow-100 text-yellow-700'
      case 'hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Mock Interview</h1>
        <p className="text-muted-foreground">
          Practice technical interviews with AI-generated questions
        </p>
      </div>

      {!isInterviewActive ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Start Interview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-green-500" />
                Start New Interview
              </CardTitle>
              <CardDescription>
                Select technologies you want to be tested on
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {techOptions.map(tech => (
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

              {selectedTech.length > 0 && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm font-medium">Selected: {selectedTech.join(', ')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You will receive 5-10 questions based on your selection
                  </p>
                </div>
              )}

              <Button
                onClick={handleStartInterview}
                className="w-full"
                loading={interviewLoading}
                disabled={selectedTech.length === 0}
              >
                <Play className="mr-2 h-4 w-4" />
                Start Interview
              </Button>
            </CardContent>
          </Card>

          {/* Latest Result */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
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
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDate(latestResult.created_at)}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <Code className="mx-auto h-5 w-5 text-blue-500" />
                      <p className="mt-1 text-lg font-bold">
                        {(latestResult as unknown as { details: { technical_accuracy: number } }).details?.technical_accuracy || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Technical</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <MessageSquare className="mx-auto h-5 w-5 text-green-500" />
                      <p className="mt-1 text-lg font-bold">
                        {(latestResult as unknown as { details: { communication_score: number } }).details?.communication_score || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Communication</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <Brain className="mx-auto h-5 w-5 text-purple-500" />
                      <p className="mt-1 text-lg font-bold">
                        {(latestResult as unknown as { details: { problem_solving_score: number } }).details?.problem_solving_score || 0}%
                      </p>
                      <p className="text-xs text-muted-foreground">Problem Solving</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium">No interviews yet</p>
                  <p className="text-sm text-muted-foreground">
                    Start your first mock interview
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Interview In Progress */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                {currentQuestion && (
                  <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                    {currentQuestion.difficulty}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-lg font-mono">
                <Timer className={`h-5 w-5 ${timeLeft < 30 ? 'text-red-500 animate-pulse' : ''}`} />
                <span className={timeLeft < 30 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
              </div>
            </div>
            <Progress value={questions.length ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0} className="mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion && (
              <>
                <div className="rounded-lg bg-muted p-6">
                  <Badge variant="outline" className="mb-3">{currentQuestion.category}</Badge>
                  <p className="text-lg">{currentQuestion.question}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Answer</label>
                  <Textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    rows={8}
                    className="resize-none"
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsInterviewActive(false)
                      toast.info('Interview cancelled')
                    }}
                  >
                    End Interview
                  </Button>
                  <Button onClick={() => void advanceQuestion('manual')} className="flex-1" disabled={isAdvancing}>
                    {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Interview'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Interview History */}
      {interviewResults.length > 0 && !isInterviewActive && (
        <Card>
          <CardHeader>
            <CardTitle>Interview History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {interviewResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <MessageSquare className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Technical Interview</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(result.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {(result as unknown as { details: { questions_answered: number; total_questions: number } }).details?.questions_answered || 0}/{(result as unknown as { details: { questions_answered: number; total_questions: number } }).details?.total_questions || 0} questions
                        </p>
                      </div>
                      <Badge variant={result.score >= 70 ? 'success' : result.score >= 50 ? 'warning' : 'destructive'}>
                        {result.score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
