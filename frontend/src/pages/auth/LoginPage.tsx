import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/services/api'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Mail } from 'lucide-react'
import logo from '../../assets/logo.png'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [pendingEmail, setPendingEmail] = useState('')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login, googleLogin, isLoading, error, clearError } = useAuthStore()
  const verificationPending = searchParams.get('pending') === '1'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      clearError()
      await login(data.email, data.password)
      const { user } = useAuthStore.getState()
      toast.success('Welcome back!')
      
      if (user?.role === 'instructor' || user?.role === 'admin') {
        navigate('/instructor')
      } else {
        navigate('/dashboard')
      }
    } catch {
      setPendingEmail(data.email)
      toast.error(error || 'Login failed. Please try again.')
    }
  }

  const handleGoogleSuccess = async (credential: string) => {
    try {
      clearError()
      await googleLogin(credential)
      const { user } = useAuthStore.getState()
      toast.success('Welcome back!')

      if (user?.role === 'instructor' || user?.role === 'admin') {
        navigate('/instructor')
      } else {
        navigate('/dashboard')
      }
    } catch {
      toast.error(error || 'Google login failed. Please try again.')
    }
  }

  const handleResendVerification = async () => {
    if (!pendingEmail) return
    setResendLoading(true)
    try {
      await authApi.resendVerification(pendingEmail)
      toast.success('Verification email sent. Please check your inbox.')
    } catch {
      toast.error('Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <ScrollReveal once={true} threshold={0} className="relative w-full max-w-md animate-fade-up">
        <Card className="glass-strong border-[#1E1E2E] shadow-[0_0_60px_rgba(108,99,255,0.08)]">
          {verificationPending && (
            <div className="border-b border-[#FFB02030] bg-[#FFB02012] px-4 py-2.5 text-center text-xs text-[#E8C878]">
              <div className="mx-auto flex max-w-sm items-start justify-center gap-2">
                <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#FFB020]" aria-hidden />
                <p className="text-pretty leading-snug">
                  <span className="font-semibold text-[#FFE4A8]">Verification pending.</span>{' '}
                  Check your inbox for the link, then sign in below. You can resend from here if login shows an error.
                </p>
              </div>
            </div>
          )}
          <CardHeader className="text-center">
            {/* Logo with breathe glow */}
            <div className="mx-auto mb-4 relative animate-fade-up" style={{ animationDelay: '80ms' }}>
              <div className="flex items-center justify-center rounded-lg">
                <img src={logo} alt="NexusMG" className='h-24 w-24 object-contain' />
              </div>
            </div>
            <CardTitle className="text-2xl animate-fade-up" style={{ animationDelay: '120ms' }}>
              Welcome Back
            </CardTitle>
            <CardDescription className="animate-fade-up" style={{ animationDelay: '160ms' }}>
              Sign in to your NexusMG account to continue
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="space-y-2 animate-fade-up" style={{ animationDelay: '200ms' }}>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  className={errors.email ? 'border-[#FF4D6D] focus-visible:ring-[#FF4D6D]' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-[#FF4D6D] animate-fade-up">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2 animate-fade-up" style={{ animationDelay: '260ms' }}>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    {...register('password')}
                    className={errors.password ? 'border-[#FF4D6D] focus-visible:ring-[#FF4D6D] pr-10' : 'pr-10'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44445A] hover:text-[#F0F0FF] transition-colors duration-150"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-[#FF4D6D] animate-fade-up">{errors.password.message}</p>
                )}
              </div>

              {error && (
                <div className="space-y-3 rounded-lg bg-[#FF4D6D15] border border-[#FF4D6D30] p-3 text-sm text-[#FF4D6D] animate-fade-up">
                  <p>{error}</p>
                  {error.toLowerCase().includes('not verified') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={resendLoading}
                      onClick={handleResendVerification}
                      className="w-full"
                    >
                      Resend verification email
                    </Button>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                className="w-full animate-fade-up"
                style={{ animationDelay: '320ms' }}
                loading={isLoading}
              >
                Sign In
              </Button>
              <div className="flex w-full items-center gap-3 text-xs text-[#44445A]">
                <span className="h-px flex-1 bg-[#1E1E2E]" />
                or
                <span className="h-px flex-1 bg-[#1E1E2E]" />
              </div>
              <div className="w-full animate-fade-up" style={{ animationDelay: '360ms' }}>
                <GoogleAuthButton onSuccess={handleGoogleSuccess} />
              </div>
              <p className="text-center text-sm text-[#8888AA] animate-fade-up" style={{ animationDelay: '380ms' }}>
                {"Don't have an account?"}{' '}
                <Link to="/register" className="font-medium text-[#6C63FF] hover:text-[#5B54E6] transition-colors duration-150">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        {/* Ambient glow behind card */}
        <div
          className="absolute -inset-8 -z-10 rounded-3xl bg-[#6C63FF] opacity-[0.04] blur-3xl"
          style={{ animation: 'logoBreathe 5s ease-in-out infinite' }}
        />
      </ScrollReveal>
    </div>
  )
}
