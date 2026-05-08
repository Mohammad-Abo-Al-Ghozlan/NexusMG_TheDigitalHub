import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
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
  Trash2,
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
  experiences: z.array(z.object({
    title: z.string().min(2, 'Title is required'),
    company: z.string().min(2, 'Company is required'),
    location: z.string().optional(),
    description: z.string().min(10, 'Description must be at least 10 characters'),
  })).min(1, 'Please add at least one experience'),
  skills: z.string().min(5, 'Please list at least a few skills'),
  education: z.string().min(10, 'Please describe your education'),
  location: z.string().min(2, 'Please enter your location'),
  connections: z.number().min(0, 'Connections cannot be negative'),
  followers: z.number().min(0, 'Followers cannot be negative'),
  certifications: z.string().optional(),
  languages: z.string().optional(),
  projects: z.array(z.object({
    title: z.string().min(2, 'Title is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
  })).optional(),
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
    defaultValues: {
      experiences: [{ title: '', company: '', location: '', description: '' }],
      projects: [{ title: '', description: '' }],
      connections: 0,
      followers: 0,
    }
  })

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control: manualForm.control,
    name: 'experiences'
  })

  const { fields: projFields, append: appendProj, remove: removeProj } = useFieldArray({
    control: manualForm.control,
    name: 'projects'
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
      await submitManualLinkedIn({
        headline: data.headline,
        summary: data.summary,
        experiences: data.experiences,
        skills: data.skills.split(',').map(s => s.trim()),
        education: data.education.split('\n').filter(e => e.trim()).map((edu) => ({
          school: edu.trim(),
          degree_name: 'Degree',
        })),
        location: data.location,
        connections: data.connections,
        follower_count: data.followers,
        certifications: data.certifications ? data.certifications.split(',').map(c => ({ name: c.trim() })) : [],
        languages: data.languages ? data.languages.split(',').map(l => ({ name: l.trim() })) : [],
        accomplishments: {
          projects: data.projects || []
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
        <Card className="h-fit">
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
                <form onSubmit={manualForm.handleSubmit(onManualSubmit)} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                    <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
                      <Users className="h-4 w-4 text-primary" /> Basic Information
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="headline">Professional Headline</Label>
                      <Input
                        id="headline"
                        placeholder="Software Engineer at Company"
                        {...manualForm.register('headline')}
                      />
                      {manualForm.formState.errors.headline && (
                        <p className="text-sm text-destructive">{manualForm.formState.errors.headline.message}</p>
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
                        <p className="text-sm text-destructive">{manualForm.formState.errors.summary.message}</p>
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
                        <p className="text-sm text-destructive">{manualForm.formState.errors.location.message}</p>
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
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="followers">Followers</Label>
                        <Input
                          id="followers"
                          type="number"
                          placeholder="1000"
                          {...manualForm.register('followers', { valueAsNumber: true })}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Experience Section */}
                  <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-primary" /> Experience
                      </h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => appendExp({ title: '', company: '', location: '', description: '' })}
                      >
                        Add Experience
                      </Button>
                    </div>

                    {expFields.map((field, index) => (
                      <div key={field.id} className="space-y-3 p-3 border rounded bg-background/50 relative group">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeExp(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Job Title</Label>
                            <Input placeholder="e.g. Senior Dev" {...manualForm.register(`experiences.${index}.title`)} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Company</Label>
                            <Input placeholder="e.g. Tech Corp" {...manualForm.register(`experiences.${index}.company`)} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Description</Label>
                          <Textarea 
                            placeholder="Key responsibilities and achievements..." 
                            rows={2}
                            {...manualForm.register(`experiences.${index}.description`)} 
                          />
                        </div>
                      </div>
                    ))}
                    {manualForm.formState.errors.experiences && (
                      <p className="text-sm text-destructive">{manualForm.formState.errors.experiences.message}</p>
                    )}
                  </div>

                  {/* Skills & Others */}
                  <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                    <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
                      <Award className="h-4 w-4 text-primary" /> Skills & Education
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="skills">Skills (comma-separated)</Label>
                      <Input
                        id="skills"
                        placeholder="Python, JavaScript, React, Node.js..."
                        {...manualForm.register('skills')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="education">Education (one per line)</Label>
                      <Textarea
                        id="education"
                        placeholder="BS Computer Science at Uni...&#10;High School..."
                        rows={2}
                        {...manualForm.register('education')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certifications">Certifications (comma-separated)</Label>
                      <Input
                        id="certifications"
                        placeholder="AWS Solutions Architect, Google Professional Developer..."
                        {...manualForm.register('certifications')}
                      />
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div className="space-y-4 rounded-lg border p-4 bg-muted/30">
                    <div className="flex justify-between items-center border-b pb-2">
                      <h3 className="font-semibold text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-primary" /> Projects
                      </h3>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => appendProj({ title: '', description: '' })}
                      >
                        Add Project
                      </Button>
                    </div>

                    {projFields.map((field, index) => (
                      <div key={field.id} className="space-y-3 p-3 border rounded bg-background/50 relative group">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeProj(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <div className="space-y-1">
                          <Label className="text-xs">Project Title</Label>
                          <Input placeholder="e.g. NexusMG SaaS" {...manualForm.register(`projects.${index}.title`)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Project Description</Label>
                          <Textarea 
                            placeholder="What does it do? Technologies used?" 
                            rows={2}
                            {...manualForm.register(`projects.${index}.description`)} 
                          />
                        </div>
                      </div>
                    ))}
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
