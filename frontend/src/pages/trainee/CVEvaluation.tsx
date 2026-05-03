import { useState, useEffect } from 'react'
import { useEvaluationStore } from '@/stores/evaluationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Eye,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export function CVEvaluationPage() {
  const [cvText, setCvText] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const {
    cvResults,
    cvLoading,
    submitCV,
    fetchCVResults,
  } = useEvaluationStore()

  useEffect(() => {
    fetchCVResults()
  }, [fetchCVResults])

  const handleSubmit = async () => {
    if (!cvText.trim()) {
      toast.error('Please enter your CV content')
      return
    }
    try {
      await submitCV(cvText)
      toast.success('CV submitted for evaluation!')
      setCvText('')
    } catch {
      toast.error('Failed to submit CV')
    }
  }

  const latestResult = cvResults[0]
  const details = latestResult?.details as unknown as {
    strengths: string[]
    improvements: string[]
    ats_score: number
    keywords: string[]
    suggestions: string[]
  } | undefined

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
        <h1 className="text-2xl font-bold text-[#F0F0FF]">CV Evaluation</h1>
        <p className="text-[#8888AA]">Get AI-powered feedback on your resume</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Submit Form */}
        <Card className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="h-0.5 w-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] rounded-t-xl" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#6C63FF]" />
              Submit Your CV
            </CardTitle>
            <CardDescription>Paste your CV content below for AI evaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`relative rounded-xl border-2 border-dashed p-1 transition-all duration-200 ${
                isDragging
                  ? 'border-[#6C63FF] bg-[#6C63FF0D] shadow-[0_0_20px_rgba(108,99,255,0.15)]'
                  : 'border-[#1E1E2E] hover:border-[#2A2A3E]'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                const text = e.dataTransfer.getData('text')
                if (text) setCvText(text)
              }}
            >
              <Textarea
                placeholder="Paste your CV text here..."
                value={cvText}
                onChange={(e) => setCvText(e.target.value)}
                className="min-h-[300px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-[#F0F0FF] placeholder:text-[#44445A]"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#44445A]">{cvText.length} characters</span>
              <Button onClick={handleSubmit} loading={cvLoading} className="gap-2">
                <Upload className="h-4 w-4" />
                Evaluate CV
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Latest Result */}
        <Card className="animate-fade-up" style={{ animationDelay: '120ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#00D4FF]" />
              Latest Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cvLoading && !latestResult ? (
              <div className="space-y-3">
                <div className="skeleton h-6 w-1/3" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-4/5" />
                <div className="skeleton h-4 w-3/5" />
              </div>
            ) : latestResult ? (
              <div className="space-y-5 feedback-stagger">
                <div className="flex items-center justify-between rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-4">
                  <div>
                    <p className="text-sm text-[#8888AA]">Overall Score</p>
                    <p className="text-4xl font-bold font-score gradient-text-violet-cyan">{latestResult.score}%</p>
                  </div>
                  <Badge variant={latestResult.score >= 70 ? 'success' : latestResult.score >= 50 ? 'warning' : 'destructive'}>
                    {latestResult.score >= 70 ? 'Strong' : latestResult.score >= 50 ? 'Good' : 'Needs Work'}
                  </Badge>
                </div>

                {details?.ats_score !== undefined && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#8888AA]">ATS Compatibility</span>
                      <span className="font-score font-medium text-[#F0F0FF]">{details.ats_score}%</span>
                    </div>
                    <Progress value={details.ats_score} />
                  </div>
                )}

                {details?.strengths && details.strengths.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-[#F0F0FF] flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-[#00C896]" /> Strengths
                    </p>
                    <ul className="space-y-1.5">
                      {details.strengths.map((s, i) => (
                        <li key={i} className="rounded-lg px-3 py-2 text-sm feedback-strength">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {details?.improvements && details.improvements.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-[#F0F0FF] flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-[#FFB830]" /> Areas to Improve
                    </p>
                    <ul className="space-y-1.5">
                      {details.improvements.map((item, i) => (
                        <li key={i} className="rounded-lg px-3 py-2 text-sm feedback-improvement">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {details?.keywords && details.keywords.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-[#F0F0FF]">Detected Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {details.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="border-[#6C63FF30] text-[#6C63FF] bg-[#6C63FF08]">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-right text-xs text-[#44445A]">{formatDate(latestResult.created_at)}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6C63FF10]">
                  <FileText className="h-8 w-8 text-[#44445A]" />
                </div>
                <p className="font-medium text-[#F0F0FF]">No evaluations yet</p>
                <p className="mt-1 text-sm text-[#8888AA]">Submit your CV to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {cvResults.length > 1 && (
        <Card className="animate-fade-up" style={{ animationDelay: '180ms' }}>
          <CardHeader>
            <CardTitle>Evaluation History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3 table-stagger">
                {cvResults.map((result) => (
                  <div key={result.id} className="flex items-center justify-between rounded-xl border border-[#1E1E2E] bg-[#0A0A0F] p-4 transition-colors duration-150 hover:border-[#2A2A3E] hover:bg-[#16161F]">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6C63FF15]">
                        <FileText className="h-4 w-4 text-[#6C63FF]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#F0F0FF]">CV Evaluation</p>
                        <p className="text-xs text-[#8888AA]">{formatDate(result.created_at)}</p>
                      </div>
                    </div>
                    <Badge variant={result.score >= 70 ? 'success' : result.score >= 50 ? 'warning' : 'destructive'}>
                      {result.score}%
                    </Badge>
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
