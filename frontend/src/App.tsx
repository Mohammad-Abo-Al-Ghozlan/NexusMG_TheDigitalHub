import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuthStore } from '@/stores/authStore'

// Layouts
import { PublicLayout } from '@/layouts/PublicLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { OnboardingGuard } from '@/components/guards/OnboardingGuard'
// Public Pages
import { LandingPage } from '@/pages/public/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage'

// Trainee Pages
import { Onboarding } from '@/pages/trainee/Onboarding'
import { TraineeDashboard } from '@/pages/trainee/Dashboard'
import { CVEvaluationPage } from '@/pages/trainee/CVEvaluation'
import { GitHubEvaluationPage } from '@/pages/trainee/GitHubEvaluation'
import { LinkedInEvaluationPage } from '@/pages/trainee/LinkedInEvaluation'
import { IdeaEvaluationPage } from '@/pages/trainee/IdeaEvaluation'
import { InterviewPage } from '@/pages/trainee/Interview'
import { EnglishAssessmentPage } from '@/pages/trainee/EnglishAssessment'
import { ProfilePage } from '@/pages/trainee/Profile'
import { CareerAdvisorPage } from '@/pages/shared/CareerAdvisor'
import { MessagesPage } from '@/pages/shared/Messages'

// Instructor Pages
import { InstructorDashboard } from '@/pages/instructor/Dashboard'
import { TraineesPage } from '@/pages/instructor/Trainees'
import { TraineeDetailPage } from '@/pages/instructor/TraineeDetail'
import { AnalyticsPage } from '@/pages/instructor/Analytics'

const getHomePath = (role?: string) => {
  if (role === 'instructor' || role === 'admin') return '/instructor'
  return '/dashboard'
}

// Protected Route Component
function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { isAuthenticated, user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getHomePath(user.role)} replace />
  }

  return <>{children}</>
}

export default function App() {
  const { fetchUser, isAuthenticated, user } = useAuthStore()

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  return (
    <TooltipProvider>
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
        </Route>

        {/* Trainee Routes */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['trainee']}>
              <OnboardingGuard />
            </ProtectedRoute>
          }
        >
          <Route path="/onboarding" element={<Onboarding />} />
          
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<TraineeDashboard />} />
            <Route path="cv" element={<CVEvaluationPage />} />
            <Route path="github" element={<GitHubEvaluationPage />} />
            <Route path="linkedin" element={<LinkedInEvaluationPage />} />
            <Route path="idea" element={<IdeaEvaluationPage />} />
            <Route path="interview" element={<InterviewPage />} />
            <Route path="english" element={<EnglishAssessmentPage />} />
            <Route path="advisor" element={<CareerAdvisorPage />} />
            <Route path="messages" element={<MessagesPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* Instructor Routes */}
        <Route
          path="/instructor"
          element={
            <ProtectedRoute allowedRoles={['instructor', 'admin']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<InstructorDashboard />} />
          <Route path="trainees" element={<TraineesPage />} />
          <Route path="trainees/:id" element={<TraineeDetailPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="advisor" element={<CareerAdvisorPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? getHomePath(user?.role) : '/'} replace />} />
      </Routes>
    </TooltipProvider>
  )
}
