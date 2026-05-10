import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { instructorApi } from '@/services/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  Search,
  Mail,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
} from 'lucide-react'

interface Trainee {
  id: string
  full_name: string
  email: string
  avatar_url?: string
  readiness_score: number
  last_active: string
  status: 'improving' | 'stable' | 'needs_attention'
  modules: {
    cv: number
    github: number
    linkedin: number
    idea: number
    interview: number
    english: number
  }
}

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email'),
})

type InviteForm = z.infer<typeof inviteSchema>

export function TraineesPage() {
  const [trainees, setTrainees] = useState<Trainee[]>([])
  const [filteredTrainees, setFilteredTrainees] = useState<Trainee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isExportingAll, setIsExportingAll] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
  })

  useEffect(() => {
    fetchTrainees()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      setFilteredTrainees(
        trainees.filter(
          t =>
            t.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.email.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    } else {
      setFilteredTrainees(trainees)
    }
  }, [searchQuery, trainees])

  const fetchTrainees = async () => {
    try {
      const response = await instructorApi.getTrainees()
      setTrainees(response.data)
      setFilteredTrainees(response.data)
    } catch (error) {
      console.error('Failed to fetch trainees:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const onInvite = async (data: InviteForm) => {
    setIsInviting(true)
    try {
      await instructorApi.inviteTrainee(data.email)
      toast.success(`Invitation sent to ${data.email}`)
      setIsInviteOpen(false)
      reset()
    } catch {
      toast.error('Failed to send invitation')
    } finally {
      setIsInviting(false)
    }
  }

  const handleExportAll = async (format: 'pdf' | 'csv') => {
    setIsExportingAll(true)
    try {
      const response = await instructorApi.exportAll(format)
      const blob = response.data instanceof Blob ? response.data : new Blob([response.data])
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `all_trainees_report.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(`Report exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      console.error('Export failed:', error)
      toast.error('Failed to export report')
    } finally {
      setIsExportingAll(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'needs_attention':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'improving':
        return <Badge variant="success">Improving</Badge>
      case 'needs_attention':
        return <Badge variant="destructive">Needs Attention</Badge>
      default:
        return <Badge variant="secondary">Stable</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trainees</h1>
          <p className="text-muted-foreground">
            Manage and monitor your trainees&apos; progress
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExportAll('csv')} disabled={isExportingAll || trainees.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => handleExportAll('pdf')} disabled={isExportingAll || trainees.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Trainee
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Trainee</DialogTitle>
              <DialogDescription>
                Send an invitation email to add a new trainee to your program.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onInvite)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="trainee@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={isInviting}>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search trainees by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{trainees.length}</p>
                <p className="text-sm text-muted-foreground">Total Trainees</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {trainees.filter(t => t.status === 'improving').length}
                </p>
                <p className="text-sm text-muted-foreground">Improving</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {trainees.filter(t => t.status === 'needs_attention').length}
                </p>
                <p className="text-sm text-muted-foreground">Need Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainees List */}
      <Card>
        <CardHeader>
          <CardTitle>All Trainees</CardTitle>
          <CardDescription>
            {filteredTrainees.length} trainee{filteredTrainees.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTrainees.length > 0 ? (
            <div className="space-y-4">
              {filteredTrainees.map((trainee) => (
                <Link
                  key={trainee.id}
                  to={`/instructor/trainees/${trainee.id}`}
                  className="block rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={trainee.avatar_url} />
                        <AvatarFallback>
                          {trainee.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'TR'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{trainee.full_name}</p>
                          {getStatusIcon(trainee.status)}
                        </div>
                        <p className="text-sm text-muted-foreground">{trainee.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="w-32">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Readiness</span>
                          <span className="font-medium">{trainee.readiness_score}%</span>
                        </div>
                        <Progress value={trainee.readiness_score} className="mt-1 h-2" />
                      </div>
                      {getStatusBadge(trainee.status)}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No trainees found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Invite trainees to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
