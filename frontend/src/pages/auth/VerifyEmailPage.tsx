import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2, Mail, RefreshCw, ShieldAlert } from 'lucide-react'
import logo from '../../assets/logo.png'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { applyAuth } = useAuthStore()
  const token = searchParams.get('token')
  const status = searchParams.get('status')
  const emailFromQuery = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailFromQuery)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [resendLoading, setResendLoading] = useState(false)

  const pendingMode = useMemo(() => status === 'pending' && !token, [status, token])
  const showResendForm = !token || (!!error && !isVerified)

  useEffect(() => {
    if (!token) return

    const verify = async () => {
      setIsVerifying(true)
      setError('')
      try {
        const response = await authApi.verifyEmail(token)
        const { access_token, user } = response.data
        applyAuth(access_token, user)
        setIsVerified(true)
      } catch (err: any) {
        const detail = err?.response?.data?.detail || 'Verification failed'
        setError(detail)
      } finally {
        setIsVerifying(false)
      }
    }

    verify()
  }, [token, applyAuth])

  const handleResend = async () => {
    if (!email) {
      toast.error('Enter your email to resend verification')
      return
    }
    setResendLoading(true)
    try {
      await authApi.resendVerification(email)
      toast.success('Verification email sent. Please check your inbox.')
    } catch {
      toast.error('Failed to resend verification email')
    } finally {
      setResendLoading(false)
    }
  }

  const handleContinue = () => {
    const { user } = useAuthStore.getState()
    if (user?.role === 'instructor' || user?.role === 'admin') {
      navigate('/instructor')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <ScrollReveal once={true} threshold={0} className="relative w-full max-w-md animate-fade-up">
        <Card className="glass-strong border-[#1E1E2E] shadow-[0_0_60px_rgba(108,99,255,0.08)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 relative animate-fade-up" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center justify-center rounded-lg">
                <img src={logo} alt="NexusMG" className="h-20 w-20 object-contain" />
              </div>
            </div>
            <CardTitle className="text-2xl animate-fade-up" style={{ animationDelay: '100ms' }}>
              Email Verification
            </CardTitle>
            <CardDescription className="animate-fade-up" style={{ animationDelay: '140ms' }}>
              Secure your account to unlock NexusMG.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isVerifying && (
              <div className="rounded-lg border border-[#2A2A3E] bg-[#0A0A0F] p-4 text-sm text-[#8888AA]">
                Verifying your email...
              </div>
            )}

            {isVerified && (
              <div className="rounded-lg border border-[#00C89640] bg-[#00C89610] p-4 text-sm text-[#00C896] flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Email verified successfully.
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-[#FF4D6D30] bg-[#FF4D6D15] p-4 text-sm text-[#FF4D6D] flex items-start gap-2">
                <ShieldAlert className="mt-0.5 h-4 w-4" />
                {error}
              </div>
            )}

            {showResendForm && (
              <div className="rounded-lg border border-[#2A2A3E] bg-[#0A0A0F] p-4 text-sm text-[#8888AA] flex items-start gap-2">
                <Mail className="mt-0.5 h-4 w-4 text-[#6C63FF]" />
                {pendingMode
                  ? 'We sent you a verification link. Check your inbox or resend it below.'
                  : 'Enter your email to request a new verification link.'}
              </div>
            )}

            {showResendForm && (
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            {isVerified ? (
              <Button className="w-full" onClick={handleContinue}>
                Continue to NexusMG
              </Button>
            ) : (
              <Button className="w-full" onClick={handleResend} loading={resendLoading} disabled={!email}>
                <RefreshCw className="h-4 w-4" />
                Resend verification email
              </Button>
            )}
            <p className="text-center text-sm text-[#8888AA]">
              <Link
                to={pendingMode ? '/login?pending=1' : '/login'}
                className="font-medium text-[#6C63FF] hover:text-[#5B54E6] transition-colors duration-150"
              >
                Back to login
              </Link>
            </p>
          </CardFooter>
        </Card>

        <div
          className="absolute -inset-8 -z-10 rounded-3xl bg-[#6C63FF] opacity-[0.04] blur-3xl"
          style={{ animation: 'logoBreathe 5s ease-in-out infinite' }}
        />
      </ScrollReveal>
    </div>
  )
}
