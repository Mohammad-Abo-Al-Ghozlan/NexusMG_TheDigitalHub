import { useState, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  User,
  Mail,
  Calendar,
  Shield,
  Camera,
  Save,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Upload,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
})

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((d) => d.new_password === d.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { user, fetchUser } = useAuthStore()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user?.email || '',
    },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
  })

  /* ── Helpers ─────────────────────────────────────── */
  const initials = user?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U'

  const roleColor: Record<string, string> = {
    trainee: 'bg-[#6C63FF15] text-[#6C63FF] border-[#6C63FF30]',
    instructor: 'bg-[#00D4FF15] text-[#00D4FF] border-[#00D4FF30]',
    admin: 'bg-[#FFB83015] text-[#FFB830] border-[#FFB83030]',
  }

  /* ── Avatar upload ─────────────────────────────── */
  const handleAvatarFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3 MB'); return }

    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setAvatarLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchUser()
      toast.success('Profile picture updated!')
    } catch {
      toast.error('Failed to upload avatar. Please try again.')
      setAvatarPreview(null)
    } finally {
      setAvatarLoading(false)
    }
  }, [fetchUser])

  const onAvatarDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleAvatarFile(f)
  }

  /* ── Profile submit ────────────────────────────── */
  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileLoading(true)
    try {
      await api.put('/users/me', data)
      await fetchUser()
      toast.success('Profile updated successfully')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  /* ── Password submit ───────────────────────────── */
  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordLoading(true)
    try {
      await api.put('/users/me/password', {
        current_password: data.current_password,
        new_password: data.new_password,
      })
      toast.success('Password changed successfully')
      passwordForm.reset()
    } catch {
      toast.error('Failed to change password. Is your current password correct?')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-up max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F0F0FF]">Profile Settings</h1>
        <p className="text-[#8888AA]">Manage your account information and security</p>
      </div>

      {/* ── AVATAR + QUICK INFO ─────────────────────────── */}
      <Card>
        <div className="h-0.5 w-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF] rounded-t-xl" />
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar drop zone */}
            <div
              className={`relative shrink-0 cursor-pointer group transition-transform duration-200 ${isDragging ? 'scale-105' : ''}`}
              onClick={() => avatarInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onAvatarDrop}
            >
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarFile(f); e.target.value = '' }}
              />
              <Avatar className={`h-24 w-24 ring-2 transition-all duration-200 ${isDragging ? 'ring-[#6C63FF] ring-offset-2 ring-offset-[#0A0A0F]' : 'ring-[#6C63FF30]'}`}>
                <AvatarImage src={avatarPreview || user?.avatar_url} />
                <AvatarFallback className="text-2xl font-bold bg-[#6C63FF20] text-[#6C63FF]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Camera overlay */}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {avatarLoading
                  ? <Upload className="h-6 w-6 text-white animate-bounce" />
                  : <Camera className="h-6 w-6 text-white" />
                }
              </div>
              {/* Drop hint badge */}
              <div className={`absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[#6C63FF] border-2 border-[#0A0A0F] shadow-lg transition-transform duration-200 ${isDragging ? 'scale-110' : ''}`}>
                <Camera className="h-3.5 w-3.5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold text-[#F0F0FF]">{user?.full_name}</h2>
              <p className="text-[#8888AA]">{user?.email}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge className={`capitalize border ${roleColor[user?.role || 'trainee']}`}>
                  {user?.role}
                </Badge>
                <span className="text-xs text-[#44445A]">
                  Member since {user?.created_at ? formatDate(user.created_at) : '—'}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#44445A]">
                Click or drag an image onto your avatar to update it (max 3 MB)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── PERSONAL INFO ──────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-4 w-4 text-[#6C63FF]" />
              Personal Information
            </CardTitle>
            <CardDescription>Update your display name and email address</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="flex items-center gap-1.5 text-[#8888AA] text-xs uppercase tracking-wider">
                  <User className="h-3 w-3" /> Full Name
                </Label>
                <Input
                  id="full_name"
                  placeholder="Your full name"
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-[#F0F0FF] focus:border-[#6C63FF60]"
                  {...profileForm.register('full_name')}
                />
                {profileForm.formState.errors.full_name && (
                  <p className="text-xs text-[#FF4D6D]">{profileForm.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1.5 text-[#8888AA] text-xs uppercase tracking-wider">
                  <Mail className="h-3 w-3" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-[#F0F0FF] focus:border-[#6C63FF60]"
                  {...profileForm.register('email')}
                />
                {profileForm.formState.errors.email && (
                  <p className="text-xs text-[#FF4D6D]">{profileForm.formState.errors.email.message}</p>
                )}
              </div>

              <Button
                type="submit"
                loading={profileLoading}
                className="w-full gap-2"
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* ── ACCOUNT DETAILS ────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-[#00D4FF]" />
              Account Details
            </CardTitle>
            <CardDescription>Read-only account metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { icon: User, label: 'User ID', value: user?.id ? `${user.id.toString().slice(0, 8)}…` : '—' },
              { icon: Mail, label: 'Email', value: user?.email || '—' },
              { icon: Shield, label: 'Role', value: user?.role || '—', capitalize: true },
              { icon: Calendar, label: 'Member Since', value: user?.created_at ? formatDate(user.created_at) : '—' },
            ].map(({ icon: Icon, label, value, capitalize }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF10]">
                  <Icon className="h-4 w-4 text-[#6C63FF]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[#44445A] uppercase tracking-wider">{label}</p>
                  <p className={`text-sm font-medium text-[#F0F0FF] truncate ${capitalize ? 'capitalize' : ''}`}>
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── CHANGE PASSWORD ─────────────────────────────── */}
      <Card>
        <div className="h-0.5 w-full bg-gradient-to-r from-[#FF4D6D] to-[#FFB830] rounded-t-xl" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-[#FF4D6D]" />
            Change Password
          </CardTitle>
          <CardDescription>Choose a strong password of at least 8 characters</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
            {/* Current password */}
            <div className="space-y-2">
              <Label htmlFor="current_password" className="text-[#8888AA] text-xs uppercase tracking-wider">Current Password</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-[#F0F0FF] pr-10 focus:border-[#FF4D6D60]"
                  {...passwordForm.register('current_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44445A] hover:text-[#8888AA] transition-colors"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.current_password && (
                <p className="text-xs text-[#FF4D6D]">{passwordForm.formState.errors.current_password.message}</p>
              )}
            </div>

            <Separator className="bg-[#1E1E2E]" />

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="new_password" className="text-[#8888AA] text-xs uppercase tracking-wider">New Password</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNew ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-[#F0F0FF] pr-10 focus:border-[#FF4D6D60]"
                  {...passwordForm.register('new_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44445A] hover:text-[#8888AA] transition-colors"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.new_password && (
                <p className="text-xs text-[#FF4D6D]">{passwordForm.formState.errors.new_password.message}</p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirm_password" className="text-[#8888AA] text-xs uppercase tracking-wider">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat new password"
                  className="bg-[#0A0A0F] border-[#1E1E2E] text-[#F0F0FF] pr-10 focus:border-[#FF4D6D60]"
                  {...passwordForm.register('confirm_password')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44445A] hover:text-[#8888AA] transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirm_password && (
                <p className="text-xs text-[#FF4D6D]">{passwordForm.formState.errors.confirm_password.message}</p>
              )}
            </div>

            {/* Password strength hints */}
            <div className="rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-3 space-y-1.5">
              {[
                { label: 'At least 8 characters', ok: (passwordForm.watch('new_password') || '').length >= 8 },
                { label: 'Passwords match', ok: passwordForm.watch('new_password') === passwordForm.watch('confirm_password') && !!passwordForm.watch('confirm_password') },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2 text-xs">
                  {ok
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-[#00C896]" />
                    : <AlertTriangle className="h-3.5 w-3.5 text-[#44445A]" />
                  }
                  <span className={ok ? 'text-[#00C896]' : 'text-[#44445A]'}>{label}</span>
                </div>
              ))}
            </div>

            <Button
              type="submit"
              loading={passwordLoading}
              variant="outline"
              className="w-full gap-2 border-[#FF4D6D30] text-[#FF4D6D] hover:bg-[#FF4D6D10] hover:border-[#FF4D6D60]"
            >
              <Lock className="h-4 w-4" />
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
