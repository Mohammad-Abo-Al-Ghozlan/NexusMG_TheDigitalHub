import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Cpu, Eye, EyeOff } from 'lucide-react'
import logo from '../../assets/logo.png'

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['trainee', 'instructor']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { register: registerUser, isLoading, error, clearError } = useAuthStore()

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'trainee' },
  })

  const selectedRole = watch('role')

  const onSubmit = async (data: RegisterForm) => {
    try {
      clearError()
      await registerUser({ email: data.email, password: data.password, full_name: data.full_name, role: data.role })
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch {
      toast.error(error || 'Registration failed. Please try again.')
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="relative w-full max-w-md animate-fade-up">
        <Card className="glass-strong border-[#1E1E2E] shadow-[0_0_60px_rgba(108,99,255,0.08)]">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 relative animate-fade-up" style={{ animationDelay: '60ms' }}>
              <div className="flex items-center justify-center rounded-lg">
                <img src={logo} alt="NexusMG" className='h-24 w-24 object-contain' />
              </div>
            </div>
            <CardTitle className="text-2xl animate-fade-up" style={{ animationDelay: '100ms' }}>Create Account</CardTitle>
            <CardDescription className="animate-fade-up" style={{ animationDelay: '140ms' }}>
              Join NexusMG and start your developer readiness journey
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              {[
                { delay: '180ms', id: 'full_name', label: 'Full Name', el: (
                  <Input id="full_name" placeholder="John Doe" {...register('full_name')}
                    className={errors.full_name ? 'border-[#FF4D6D] focus-visible:ring-[#FF4D6D]' : ''} />
                ), err: errors.full_name },
                { delay: '220ms', id: 'email', label: 'Email', el: (
                  <Input id="email" type="email" placeholder="you@example.com" {...register('email')}
                    className={errors.email ? 'border-[#FF4D6D] focus-visible:ring-[#FF4D6D]' : ''} />
                ), err: errors.email },
              ].map(({ delay, id, label, el, err }) => (
                <div key={id} className="space-y-2 animate-fade-up" style={{ animationDelay: delay }}>
                  <Label htmlFor={id}>{label}</Label>
                  {el}
                  {err && <p className="text-sm text-[#FF4D6D] animate-fade-up">{err.message}</p>}
                </div>
              ))}

              <div className="space-y-2 animate-fade-up" style={{ animationDelay: '260ms' }}>
                <Label htmlFor="role">I am a</Label>
                <Select value={selectedRole} onValueChange={(v: 'trainee' | 'instructor') => setValue('role', v)}>
                  <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trainee">Trainee / Developer</SelectItem>
                    <SelectItem value="instructor">Instructor / Mentor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 animate-fade-up" style={{ animationDelay: '300ms' }}>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Create a password"
                    {...register('password')} className={errors.password ? 'border-[#FF4D6D] pr-10' : 'pr-10'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#44445A] hover:text-[#F0F0FF] transition-colors duration-150">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-[#FF4D6D] animate-fade-up">{errors.password.message}</p>}
              </div>

              <div className="space-y-2 animate-fade-up" style={{ animationDelay: '340ms' }}>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Confirm your password"
                  {...register('confirmPassword')} className={errors.confirmPassword ? 'border-[#FF4D6D]' : ''} />
                {errors.confirmPassword && <p className="text-sm text-[#FF4D6D] animate-fade-up">{errors.confirmPassword.message}</p>}
              </div>

              {error && (
                <div className="rounded-lg bg-[#FF4D6D15] border border-[#FF4D6D30] p-3 text-sm text-[#FF4D6D] animate-fade-up">
                  {error}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full animate-fade-up" style={{ animationDelay: '380ms' }} loading={isLoading}>
                Create Account
              </Button>
              <p className="text-center text-sm text-[#8888AA] animate-fade-up" style={{ animationDelay: '420ms' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-[#6C63FF] hover:text-[#5B54E6] transition-colors duration-150">Sign in</Link>
              </p>
            </CardFooter>
          </form>
        </Card>
        <div className="absolute -inset-8 -z-10 rounded-3xl bg-[#6C63FF] opacity-[0.04] blur-3xl"
          style={{ animation: 'logoBreathe 5s ease-in-out infinite' }} />
      </div>
    </div>
  )
}
