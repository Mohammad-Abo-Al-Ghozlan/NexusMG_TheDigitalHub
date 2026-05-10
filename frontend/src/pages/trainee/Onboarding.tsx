import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { userApi } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowRight, ArrowLeft, Loader2, Rocket } from 'lucide-react'

interface Question {
  id: string
  text: string
  type: string
}

export function Onboarding() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const navigate = useNavigate()
  const { fetchUser } = useAuthStore()

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await userApi.getOnboardingQuestions()
        setQuestions(res.data.questions)
      } catch (error) {
        console.error('Failed to fetch questions', error)
        toast.error('Failed to load onboarding questions. Please try again later.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchQuestions()
  }, [])

  const handleNext = () => {
    if (!answers[questions[currentIndex].id]?.trim()) {
      toast.error('Please provide an answer to continue.')
      return
    }
    setCurrentIndex(prev => prev + 1)
  }

  const handleBack = () => {
    setCurrentIndex(prev => prev - 1)
  }

  const handleSubmit = async () => {
    if (!answers[questions[currentIndex].id]?.trim()) {
      toast.error('Please provide an answer to finish.')
      return
    }

    setIsSubmitting(true)
    try {
      const submission = {
        answers: Object.entries(answers).map(([question_id, answer]) => ({
          question_id,
          answer
        }))
      }
      
      await userApi.submitOnboarding(submission)
      await fetchUser() // Refresh user to get updated is_onboarded status
      toast.success('Onboarding complete! Welcome aboard.')
      navigate('/dashboard')
    } catch (error) {
      console.error('Submission failed', error)
      toast.error('Failed to submit onboarding. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#6C63FF]" />
          <p className="text-[#8888AA] animate-pulse">Preparing your personalized onboarding...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#05050A]">
        <Card className="w-full max-w-md border-[#1E1E2E] bg-[#0A0A0F]">
          <CardHeader>
            <CardTitle>Oops!</CardTitle>
            <CardDescription>Could not load questions. Please refresh the page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]
  const isLast = currentIndex === questions.length - 1
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#05050A] p-4">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-[#6C63FF] opacity-[0.05] blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-2xl z-10 space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2 text-[#F0F0FF]">
            <Rocket className="h-5 w-5 text-[#6C63FF]" />
            <span className="font-semibold tracking-wide">NexusMG Onboarding</span>
          </div>
          <span className="text-sm text-[#8888AA] font-medium">
            Step {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#1E1E2E]">
          <motion.div
            className="h-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-[#1E1E2E] bg-[#0A0A0F]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(108,99,255,0.05)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-8"
            >
              <h2 className="text-2xl font-bold text-[#F0F0FF] mb-6 leading-relaxed">
                {currentQuestion.text}
              </h2>
              
              <Textarea
                autoFocus
                placeholder="Type your answer here..."
                className="min-h-[150px] resize-none border-[#1E1E2E] bg-[#12121A] text-lg p-4 focus-visible:ring-[#6C63FF] transition-all"
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    if (isLast) handleSubmit()
                    else handleNext()
                  }
                }}
              />
              <p className="mt-2 text-xs text-[#44445A] text-right">
                Press <kbd className="bg-[#1E1E2E] px-1 rounded">Ctrl</kbd> + <kbd className="bg-[#1E1E2E] px-1 rounded">Enter</kbd> to continue
              </p>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between border-t border-[#1E1E2E] bg-[#05050A]/50 p-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentIndex === 0 || isSubmitting}
              className="text-[#8888AA] hover:text-[#F0F0FF]"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>

            {isLast ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#6C63FF] hover:bg-[#5a52d5] text-white px-8"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Finalizing...
                  </>
                ) : (
                  <>
                    Complete Onboarding <Rocket className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="bg-[#0A0A0F] border border-[#1E1E2E] hover:border-[#6C63FF] hover:bg-[#12121A] text-[#F0F0FF] px-8 transition-colors"
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
