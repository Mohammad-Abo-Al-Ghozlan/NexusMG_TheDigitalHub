import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEvaluationStore } from '@/stores/evaluationStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Linkedin,
  Link as LinkIcon,
  CheckCircle2,
  Lightbulb,
  Clock,
  TrendingUp,
  Users,
  Briefcase,
  Award,
  FileEdit,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const linkedinUrlSchema = z.object({
  profileUrl: z.string().url('Please enter a valid URL').includes('linkedin.com', {
    message: 'Please enter a LinkedIn profile URL',
  }),
})

const manualSchema = z.object({
  headline: z.string().min(10, 'Headline must be at least 10 characters'),
  summary: z.string().min(50, 'Summary must be at least 50 characters'),
  experience: z.string().min(20, 'Please describe your experience'),
  skills: z.string().min(5, 'Please list at least a few skills'),
  education: z.string().min(10, 'Please describe your education'),
  location: z.string().min(2, 'Please enter your location'),
  connections: z.number().min(0, 'Connections cannot be negative'),
  followers: z.number().min(0, 'Followers cannot be negative'),
  certifications: z.string().optional(),
  languages: z.string().optional(),
  projects: z.string().optional(),
  hasProfilePic: z.enum(['yes', 'no'], {
    required_error: 'Please select if you have a profile picture',
  }),
})

type LinkedInUrlForm = z.infer<typeof linkedinUrlSchema>
type ManualForm = z.infer<typeof manualSchema>

export function LinkedInEvaluationPage() {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const { linkedinEvaluations, linkedinLoading, evaluateLinkedIn, submitManualLinkedIn, fetchLinkedInEvaluations, error } = useEvaluationStore()

  const urlForm = useForm<LinkedInUrlForm>({
    resolver: zodResolver(linkedinUrlSchema),
  })

  const manualForm = useForm<ManualForm>({
    resolver: zodResolver(manualSchema),
  })

  useEffect(() => {
    fetchLinkedInEvaluations()
  }, [fetchLinkedInEvaluations])

  const onUrlSubmit = async (data: LinkedInUrlForm) => {
    try {
      await evaluateLinkedIn(data.profileUrl)
      toast.success('LinkedIn profile evaluated successfully!')
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { detail?: string } } }
      const message = apiError.response?.data?.detail || 'Auto-fetch failed. Please try manual entry.'
      toast.error(message)
      setMode('manual')
    }
  }

  const onManualSubmit = async (data: ManualForm) => {
    try {
      // Robust splitting: try double newlines first, then single newlines
      const splitText = (text: string) => {
        const blocks = text.split(/\n{2,}/).filter(b => b.trim());
        if (blocks.length > 1) return blocks;
        return text.split('\n').filter(b => b.trim() && b.length > 5);
      };

      await submitManualLinkedIn({
        headline: data.headline,
        summary: data.summary,
        experiences: splitText(data.experience).map((exp, idx) => ({
          title: idx === 0 ? 'Professional Experience' : `Experience ${idx + 1}`,
          company: 'Company',
          description: exp.trim(),
        })),
        skills: data.skills.split(',').map(s => s.trim()),
        education: splitText(data.education).map((edu, idx) => ({
          school: edu.trim(),
          degree_name: 'Degree',
        })),
        location: data.location,
        connections: data.connections,
        follower_count: data.followers,
        certifications: data.certifications ? data.certifications.split(',').map(c => ({ name: c.trim() })) : [],
        languages: data.languages ? data.languages.split(',').map(l => ({ name: l.trim() })) : [],
        accomplishments: {
          projects: data.projects ? data.projects.split('\n').map(p => ({ title: p.trim() })) : []
        },
        has_profile_pic: data.hasProfilePic === 'yes',
      })
      toast.success('LinkedIn profile evaluated successfully!')
      manualForm.reset()
    } catch {
      toast.error(error || 'Failed to evaluate profile')
    }
  }

  const latestEvaluation = linkedinEvaluations[0]
  const details = latestEvaluation?.details as unknown as {
    profile_completeness: number
    headline_score: number
    summary_score: number
    experience_count: number
    skills_count: number
    recommendations_count: number
    network_size: string
  } | undefined

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">LinkedIn Review</h1>
        <p className="text-muted-foreground">
          Optimize your professional profile for better visibility
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Linkedin className="h-5 w-5 text-[#0077B5]" />
              Analyze Profile
            </CardTitle>
            <CardDescription>
              Enter your LinkedIn URL or manually input your profile details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'auto' | 'manual')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auto">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Auto Fetch
                </TabsTrigger>
                <TabsTrigger value="manual">
                  <FileEdit className="mr-2 h-4 w-4" />
                  Manual Entry
                </TabsTrigger>
              </TabsList>

              <TabsContent value="auto" className="mt-4">
                <form onSubmit={urlForm.handleSubmit(onUrlSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profileUrl">LinkedIn Profile URL</Label>
                    <Input
                      id="profileUrl"
                      placeholder="https://linkedin.com/in/yourprofile"
                      {...urlForm.register('profileUrl')}
                    />
                    {urlForm.formState.errors.profileUrl && (
                      <p className="text-sm text-destructive">
                        {urlForm.formState.errors.profileUrl.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" loading={linkedinLoading}>
                    Analyze Profile
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    {"If auto-fetch doesn't work, try manual entry"}
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="manual" className="mt-4">
                <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="headline">Professional Headline</Label>
                    <Input
                      id="headline"
                      placeholder="Software Engineer at Company"
                      {...manualForm.register('headline')}
                    />
                    {manualForm.formState.errors.headline && (
                      <p className="text-sm text-destructive">
                        {manualForm.formState.errors.headline.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">About / Summary</Label>
                    <Textarea
                      id="summary"
                      placeholder="Write a brief professional summary..."
                      rows={3}
                      {...manualForm.register('summary')}
                    />
                    {manualForm.formState.errors.summary && (
                      <p className="text-sm text-destructive">
                        {manualForm.formState.errors.summary.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience (separate items with a blank line)</Label>
                    <Textarea
                      id="experience"
                      placeholder="Latest Job...&#10;&#10;Previous Job..."
                      rows={4}
                      {...manualForm.register('experience')}
                    />
                    {manualForm.formState.errors.experience && (
                      <p className="text-sm text-destructive">
                        {manualForm.formState.errors.experience.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="skills">Skills (comma-separated)</Label>
                    <Input
                      id="skills"
                      placeholder="Python, JavaScript, React, Node.js..."
                      {...manualForm.register('skills')}
                    />
                    {manualForm.formState.errors.skills && (
                      <p className="text-sm text-destructive">
                        {manualForm.formState.errors.skills.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="education">Education (one per line or separate with blank lines)</Label>
                    <Textarea
                      id="education"
                      placeholder="BS Computer Science...&#10;High School..."
                      rows={3}
                      {...manualForm.register('education')}
                    />
                    {manualForm.formState.errors.education && (
                      <p className="text-sm text-destructive">
                        {manualForm.formState.errors.education.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="City, Country"
                      {...manualForm.register('location')}
                    />
                    {manualForm.formState.errors.location && (
                      <p className="text-sm text-destructive">
                        {manualForm.formState.errors.location.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="connections">Connections</Label>
                      <Input
                        id="connections"
                        type="number"
                        placeholder="500"
                        {...manualForm.register('connections', { valueAsNumber: true })}
                      />
                      {manualForm.formState.errors.connections && (
                        <p className="text-sm text-destructive">
                          {manualForm.formState.errors.connections.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="followers">Followers</Label>
                      <Input
                        id="followers"
                        type="number"
                        placeholder="1000"
                        {...manualForm.register('followers', { valueAsNumber: true })}
                      />
                      {manualForm.formState.errors.followers && (
                        <p className="text-sm text-destructive">
                          {manualForm.formState.errors.followers.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                    <Input
                      id="certifications"
                      placeholder="AWS Solutions Architect, Google Professional Developer..."
                      {...manualForm.register('certifications')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="languages">Languages (comma-separated)</Label>
                    <Input
                      id="languages"
                      placeholder="English (Professional), Arabic (Native)..."
                      {...manualForm.register('languages')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projects">Projects (one per line)</Label>
                    <Textarea
                      id="projects"
                      placeholder="NexusMG SaaS Platform&#10;Portfolio Website..."
                      rows={2}
                      {...manualForm.register('projects')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Do you have a profile picture?</Label>
                    <div className="flex gap-4 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="yes"
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          {...manualForm.register('hasProfilePic')}
                        />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="no"
                          className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                          {...manualForm.register('hasProfilePic')}
                        />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                    {manualForm.formState.errors.hasProfilePic && (
                      <p className="text-sm text-destructive">
                        {manualForm.formState.errors.hasProfilePic.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" loading={linkedinLoading}>
                    Submit for Review
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
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
                    <p className="text-sm text-muted-foreground">Profile Score</p>
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
                      <span>Profile Completeness</span>
                      <span>{details?.profile_completeness || 0}%</span>
                    </div>
                    <Progress value={details?.profile_completeness || 0} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Headline Effectiveness</span>
                      <span>{details?.headline_score || 0}%</span>
                    </div>
                    <Progress value={details?.headline_score || 0} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Summary Quality</span>
                      <span>{details?.summary_score || 0}%</span>
                    </div>
                    <Progress value={details?.summary_score || 0} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <Briefcase className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-xl font-bold">{details?.experience_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Experience</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <Award className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-xl font-bold">{details?.skills_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Skills</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <Users className="mx-auto h-5 w-5 text-primary" />
                    <p className="mt-1 text-xl font-bold">{details?.recommendations_count || 0}</p>
                    <p className="text-xs text-muted-foreground">Endorsements</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">No evaluations yet</p>
                <p className="text-sm text-muted-foreground">
                  Enter your LinkedIn details to get started
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
    </div>
  )
}
