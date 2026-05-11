import { useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { careerAdvisorApi, instructorApi, notesApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Cpu, MessageSquare, Save, Sparkles, Target } from 'lucide-react'

const modules = [
  { id: 'cv', label: 'CV Evaluation', hint: 'Resume structure and ATS readiness' },
  { id: 'github', label: 'GitHub Analysis', hint: 'Repos, activity, and code quality' },
  { id: 'linkedin', label: 'LinkedIn Review', hint: 'Profile strength and signal' },
  { id: 'idea', label: 'Idea Pitch', hint: 'Project clarity and feasibility' },
  { id: 'interview', label: 'Mock Interview', hint: 'Technical and communication feedback' },
  { id: 'english', label: 'English Test', hint: 'Professional communication level' },
]

const roleOptions = [
  'Frontend',
  'Backend',
  'Full Stack',
  'AI/ML',
  'DevOps',
  'Mobile',
  'Data Engineering',
  'Security',
]

type NoteState = Record<
  string,
  {
    note: string
    updated_at?: string
    instructor_id?: number
    instructor_name?: string
    instructor_role?: string
  }
>

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

interface TraineeSummary {
  id: number
  full_name: string
  email: string
}

const buildEmptyNotes = (): NoteState =>
  modules.reduce((acc, module) => {
    acc[module.id] = { note: '' }
    return acc
  }, {} as NoteState)

export function CareerAdvisorPage() {
  const { user } = useAuthStore()
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin'

  const [trainees, setTrainees] = useState<TraineeSummary[]>([])
  const [selectedTraineeId, setSelectedTraineeId] = useState<string>('')
  const [notes, setNotes] = useState<NoteState>(() => buildEmptyNotes())
  const [notesLoading, setNotesLoading] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)

  const [targetRole, setTargetRole] = useState('Full Stack')
  const [prompt, setPrompt] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const traineeOptions = useMemo(
    () => trainees.map((t) => ({ value: String(t.id), label: t.full_name || t.email })),
    [trainees]
  )

  useEffect(() => {
    if (!isInstructor) return

    const loadTrainees = async () => {
      try {
        const response = await instructorApi.getTrainees()
        const list = response.data as TraineeSummary[]
        setTrainees(list)
        if (list.length && !selectedTraineeId) {
          setSelectedTraineeId(String(list[0].id))
        }
      } catch {
        toast.error('Failed to load trainees')
      }
    }

    loadTrainees()
  }, [isInstructor])

  useEffect(() => {
    const loadNotes = async () => {
      setNotesLoading(true)
      try {
        const response = isInstructor
          ? await notesApi.getTraineeNotes(selectedTraineeId)
          : await notesApi.getMyNotes()

        const notesMap = buildEmptyNotes()
        const data = response.data as Array<{
          module: string
          note?: string
          updated_at?: string
          instructor_id?: number
          instructor_name?: string
          instructor_role?: string
        }>
        data.forEach((item) => {
          notesMap[item.module] = {
            note: item.note || '',
            updated_at: item.updated_at,
            instructor_id: item.instructor_id,
            instructor_name: item.instructor_name,
            instructor_role: item.instructor_role,
          }
        })
        setNotes(notesMap)
      } catch {
        toast.error('Failed to load notes')
      } finally {
        setNotesLoading(false)
      }
    }

    if (isInstructor && !selectedTraineeId) return
    loadNotes()
  }, [isInstructor, selectedTraineeId])

  const handleNoteChange = (moduleId: string, value: string) => {
    setNotes((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], note: value },
    }))
  }

  const handleSaveNotes = async () => {
    if (!selectedTraineeId) return
    setSaveLoading(true)
    try {
      const payload = modules.map((module) => ({
        module: module.id,
        note: notes[module.id]?.note || '',
      }))
      const response = await notesApi.upsertTraineeNotes(selectedTraineeId, payload)
      const notesMap = buildEmptyNotes()
      response.data.forEach(
        (item: {
          module: string
          note?: string
          updated_at?: string
          instructor_id?: number
          instructor_name?: string
          instructor_role?: string
        }) => {
          notesMap[item.module] = {
            note: item.note || '',
            updated_at: item.updated_at,
            instructor_id: item.instructor_id,
            instructor_name: item.instructor_name,
            instructor_role: item.instructor_role,
          }
        }
      )
      setNotes(notesMap)
      toast.success('Notes saved successfully')
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleSendAdvice = async () => {
    const message = prompt.trim() || 'Provide career advice based on my profile and evaluations.'
    setPrompt('')
    setChatLoading(true)
    setMessages((prev) => [...prev, { role: 'user', content: message }])

    try {
      const response = await careerAdvisorApi.getAdvice({ target_role: targetRole, message })
      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.content }])
    } catch {
      toast.error('Failed to generate career advice')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-[#F0F0FF]">Career Advisor</h1>
        <p className="text-[#8888AA]">
          Instructor guidance and AI career strategy in one workspace.
        </p>
      </div>

      <Tabs defaultValue="notes" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes">Instructor Notes</TabsTrigger>
          <TabsTrigger value="advisor">AI Career Advisor</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-6">
          <Card className="border-[#1E1E2E]">
            <CardHeader className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-[#F0F0FF]">
                    <Cpu className="h-5 w-5 text-[#6C63FF]" />
                    Evaluation Notes
                  </CardTitle>
                  <CardDescription>
                    {isInstructor
                      ? 'Write targeted feedback per evaluation module.'
                      : 'Review your instructor feedback and next steps.'}
                  </CardDescription>
                </div>
                {isInstructor && (
                  <Button onClick={handleSaveNotes} loading={saveLoading} className="gap-2">
                    <Save className="h-4 w-4" />
                    Save Notes
                  </Button>
                )}
              </div>

              {isInstructor && (
                <div className="max-w-sm">
                  <Select value={selectedTraineeId} onValueChange={setSelectedTraineeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trainee" />
                    </SelectTrigger>
                    <SelectContent>
                      {traineeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {notesLoading ? (
                <div className="rounded-lg border border-dashed border-[#2A2A3E] p-6 text-center text-sm text-[#8888AA]">
                  Loading notes...
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {modules.map((module) => (
                    <Card key={module.id} className="border-[#1E1E2E] bg-[#0B0B12]">
                      <CardHeader className="space-y-2">
                        <CardTitle className="text-base text-[#F0F0FF]">{module.label}</CardTitle>
                        <CardDescription>{module.hint}</CardDescription>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className="w-fit capitalize">
                            {notes[module.id]?.instructor_role || 'instructor'}:{' '}
                            {notes[module.id]?.instructor_name || 'Unassigned'}
                          </Badge>
                          {notes[module.id]?.updated_at && (
                            <Badge variant="outline" className="w-fit">
                              Updated: {new Date(notes[module.id].updated_at as string).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isInstructor ? (
                          <Textarea
                            value={notes[module.id]?.note || ''}
                            onChange={(e) => handleNoteChange(module.id, e.target.value)}
                            placeholder="Write actionable feedback for this module..."
                            rows={5}
                            className="resize-none"
                          />
                        ) : (
                          <div className="rounded-lg border border-[#1E1E2E] bg-[#0A0A0F] p-4 text-sm text-[#C8C8E8] whitespace-pre-wrap">
                            {notes[module.id]?.note || 'No notes yet.'}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advisor" className="space-y-6">
          <Card className="border-[#1E1E2E]">
            <CardHeader>
              <CardTitle className="text-[#F0F0FF]">Advisor Output</CardTitle>
              <CardDescription>Structured feedback with clear priorities.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[360px]">
                {messages.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-[#2A2A3E] p-6 text-center text-sm text-[#8888AA]">
                    No advice yet. Ask a question to get started.
                  </div>
                ) : (
                  <div className="space-y-4 pr-4">
                    {messages.map((message, index) => (
                      <div
                        key={`${message.role}-${index}`}
                        className={`rounded-lg border p-4 whitespace-pre-wrap ${
                          message.role === 'assistant'
                            ? 'border-[#1E1E2E] bg-[#0A0A0F] text-[#E6E6FF]'
                            : 'border-[#6C63FF30] bg-[#6C63FF10] text-[#F0F0FF]'
                        }`}
                      >
                        <div className="mb-2 text-xs uppercase tracking-wide text-[#8888AA]">
                          {message.role === 'assistant' ? 'Advisor' : 'You'}
                        </div>
                        <div className="text-sm leading-relaxed">{message.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="border-[#1E1E2E]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#F0F0FF]">
                <Sparkles className="h-5 w-5 text-[#00D4FF]" />
                AI Career Advisor
              </CardTitle>
              <CardDescription>
                Get direct, structured guidance based on your evaluations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#C8C8E8]">Target Role</label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#C8C8E8]">Your Question</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask for feedback on your portfolio, readiness gaps, or interview prep..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={handleSendAdvice} loading={chatLoading} className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Generate Advice
                </Button>
                <div className="flex items-center gap-2 text-xs text-[#8888AA]">
                  <Target className="h-3.5 w-3.5" />
                  Uses your latest evaluations and profile data.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
