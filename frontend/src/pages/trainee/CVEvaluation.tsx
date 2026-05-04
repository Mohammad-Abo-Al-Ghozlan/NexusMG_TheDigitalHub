import { useState, useEffect, useRef, useCallback } from 'react'
import { useEvaluationStore } from '@/stores/evaluationStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  File as FileIcon,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const ACCEPTED = ['.pdf', '.docx', '.doc', '.txt']
const MAX_MB = 5

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function CVEvaluationPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { cvResults, cvLoading, submitCV, fetchCVResults } = useEvaluationStore()

  useEffect(() => {
    fetchCVResults()
  }, [fetchCVResults])

  const validate = (f: File): boolean => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED.includes(ext)) {
      toast.error(`Unsupported file type. Accepted: ${ACCEPTED.join(', ')}`)
      return false
    }
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_MB} MB.`)
      return false
    }
    return true
  }

  const pickFile = (f: File) => {
    if (validate(f)) setFile(f)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) pickFile(dropped)
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)

  const handleSubmit = async () => {
    if (!file) { toast.error('Please select a CV file first'); return }
    try {
      await submitCV(file)
      toast.success('CV submitted for evaluation!')
      setFile(null)
    } catch {
      toast.error('Failed to submit CV. Please try again.')
    }
  }

  const latestResult = cvResults[0]
  const details = latestResult?.details as {
    strengths: string[]
    improvements: string[]
    ats_score: number
    keywords: string[]
    suggestions: string[]
  } | undefined

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0FF]">CV Evaluation</h1>
        <p className="text-[#8888AA]">Upload your resume for AI-powered feedback</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Card */}
        <Card className="animate-fade-up" style={{ animationDelay: '60ms' }}>
          <div className="h-0.5 w-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] rounded-t-xl" />
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#6C63FF]" />
              Upload Your CV
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Hidden file input */}
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(',')}
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }}
            />

            {/* Drop zone */}
            <div
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed
                cursor-pointer select-none transition-all duration-300 min-h-[260px] px-6 py-10
                ${isDragging
                  ? 'border-[#6C63FF] bg-[#6C63FF0D] shadow-[0_0_40px_rgba(108,99,255,0.2)] scale-[1.01]'
                  : file
                    ? 'border-[#00C896] bg-[#00C89608]'
                    : 'border-[#1E1E2E] bg-[#0A0A0F] hover:border-[#6C63FF60] hover:bg-[#6C63FF06]'
                }
              `}
            >
              {file ? (
                /* Selected file preview */
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00C89615] border border-[#00C89630]">
                      <FileIcon className="h-8 w-8 text-[#00C896]" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null) }}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#1E1E2E] border border-[#2A2A3E] text-[#8888AA] hover:text-[#FF4D6D] hover:border-[#FF4D6D40] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div>
                    <p className="font-medium text-[#F0F0FF] break-all max-w-[220px]">{file.name}</p>
                    <p className="text-xs text-[#8888AA] mt-0.5">{formatBytes(file.size)}</p>
                  </div>
                  <Badge className="border-[#00C89640] bg-[#00C89610] text-[#00C896] border">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Ready to evaluate
                  </Badge>
                </div>
              ) : (
                /* Empty state */
                <>
                  <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300 ${
                    isDragging ? 'bg-[#6C63FF20] border-[#6C63FF50]' : 'bg-[#6C63FF10] border-[#6C63FF20]'
                  }`}>
                    <Upload className={`h-8 w-8 transition-transform duration-300 ${isDragging ? 'text-[#6C63FF] scale-110' : 'text-[#6C63FF]'}`} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-[#F0F0FF]">
                      {isDragging ? 'Drop your file here' : 'Drag & drop your CV'}
                    </p>
                    <p className="mt-1 text-sm text-[#8888AA]">
                      or <span className="text-[#6C63FF] underline underline-offset-2">click to browse</span>
                    </p>
                    <p className="mt-3 text-xs text-[#44445A]">
                      Supports PDF, DOCX, DOC, TXT · Max {MAX_MB} MB
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Submit button */}
            <Button
              onClick={handleSubmit}
              disabled={!file || cvLoading}
              loading={cvLoading}
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              {cvLoading ? 'Analysing…' : 'Evaluate CV'}
            </Button>
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
              <div className="space-y-5">
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
                        <li key={i} className="rounded-lg px-3 py-2 text-sm feedback-strength">{s}</li>
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
                        <li key={i} className="rounded-lg px-3 py-2 text-sm feedback-improvement">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {details?.keywords && details.keywords.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-[#F0F0FF]">Detected Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {details.keywords.map((kw, i) => (
                        <Badge key={i} variant="outline" className="border-[#6C63FF30] text-[#6C63FF] bg-[#6C63FF08]">{kw}</Badge>
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
                <p className="mt-1 text-sm text-[#8888AA]">Upload your CV to get started</p>
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
              <div className="space-y-3">
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
