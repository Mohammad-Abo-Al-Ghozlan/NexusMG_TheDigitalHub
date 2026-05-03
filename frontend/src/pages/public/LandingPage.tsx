import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Github,
  Linkedin,
  Lightbulb,
  MessageSquare,
  Languages,
  Zap,
  Shield,
  BarChart3,
  Users,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'

const features = [
  { icon: FileText,      title: 'CV Analysis',          description: 'AI-powered resume parsing with ATS compatibility scoring and actionable feedback.' },
  { icon: Github,        title: 'GitHub Evaluation',    description: 'Deep analysis of repositories, commit patterns, code quality, and contribution metrics.' },
  { icon: Linkedin,      title: 'LinkedIn Review',      description: 'Profile optimization insights with completeness scoring and networking suggestions.' },
  { icon: Lightbulb,     title: 'Idea Validation',      description: 'AI assessment of project ideas for innovation, feasibility, and market potential.' },
  { icon: MessageSquare, title: 'Mock Interviews',       description: 'Adaptive technical interviews with real-time feedback and performance scoring.' },
  { icon: Languages,     title: 'English Proficiency',  description: 'Comprehensive language assessment aligned with CEFR standards.' },
]

const benefits = [
  'AI-powered personalized feedback',
  'Track progress over time',
  'Industry-aligned assessments',
  'Instructor oversight tools',
  'Exportable reports',
  'Real-time analytics',
]

export function LandingPage() {
  return (
    <div className="flex flex-col">

      {/* ══════════════════════════════════════
          HERO
         ══════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="mx-auto max-w-3xl text-center">

            {/* Badge */}
            <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
              <Badge
                variant="secondary"
                className="mb-6 border-[#6C63FF30] bg-[#6C63FF15] text-[#6C63FF] transition-all duration-200 hover:bg-[#6C63FF25]"
              >
                <Zap className="mr-1 h-3 w-3" />
                AI-Powered Platform
              </Badge>
            </div>

            {/* Headline */}
            <h1
              className="text-balance text-4xl font-bold tracking-tight text-[#F0F0FF] md:text-6xl animate-fade-up"
              style={{ animationDelay: '80ms' }}
            >
              Measure Your Developer{' '}
              <span className="gradient-text-violet-cyan">
                Readiness
              </span>
            </h1>

            {/* Subheading */}
            <p
              className="mt-6 text-pretty text-lg text-[#8888AA] md:text-xl animate-fade-up"
              style={{ animationDelay: '160ms' }}
            >
              NexusMG evaluates your skills across 6 critical dimensions using advanced AI.
              Get personalized feedback, track your progress, and become job-ready faster.
            </p>

            {/* CTA Buttons */}
            <div
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up"
              style={{ animationDelay: '240ms' }}
            >
              <Link to="/register">
                <Button size="lg" className="gap-2 min-w-[160px]">
                  Start Assessment
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="min-w-[120px]">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Background orbs — subtle pulse */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6C63FF] opacity-[0.07] blur-[120px]"
            style={{ animation: 'logoBreathe 6s ease-in-out infinite' }}
          />
          <div
            className="absolute right-0 bottom-0 h-[400px] w-[400px] rounded-full bg-[#00D4FF] opacity-[0.05] blur-[100px]"
            style={{ animation: 'logoBreathe 8s ease-in-out 2s infinite' }}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURES
         ══════════════════════════════════════ */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="mx-auto max-w-2xl text-center animate-fade-up">
            <Badge variant="outline" className="mb-4 border-[#1E1E2E] text-[#8888AA]">
              <BarChart3 className="mr-1 h-3 w-3" />
              6 Evaluation Modules
            </Badge>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-[#F0F0FF] md:text-4xl">
              Comprehensive Skill Assessment
            </h2>
            <p className="mt-4 text-[#8888AA]">
              Our platform evaluates developers across multiple dimensions to provide
              a complete picture of job readiness.
            </p>
          </div>

          {/* Feature cards — staggered entry + hover lift */}
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="group border-[#1E1E2E] hover:border-[#6C63FF40] cursor-default"
              >
                <CardHeader>
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#6C63FF15] transition-all duration-200 group-hover:bg-[#6C63FF25] group-hover:shadow-[0_0_20px_rgba(108,99,255,0.2)] group-hover:scale-110">
                    <feature.icon className="h-6 w-6 text-[#6C63FF] transition-transform duration-200 group-hover:scale-110" />
                  </div>
                  <CardTitle className="transition-colors duration-200 group-hover:text-[#6C63FF]">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          BENEFITS
         ══════════════════════════════════════ */}
      <section className="border-y border-[#1E1E2E] bg-[#111118]/50 py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">

            {/* Left — benefits list */}
            <div className="animate-fade-up">
              <Badge variant="outline" className="mb-4 border-[#1E1E2E] text-[#8888AA]">
                <Shield className="mr-1 h-3 w-3" />
                Why NexusMG
              </Badge>
              <h2 className="text-balance text-3xl font-bold tracking-tight text-[#F0F0FF] md:text-4xl">
                Built for Developer Success
              </h2>
              <p className="mt-4 text-[#8888AA]">
                Our platform combines cutting-edge AI with industry expertise to deliver
                assessments that matter. Whether you are a trainee or instructor,
                NexusMG provides the tools you need.
              </p>

              <ul className="mt-8 space-y-3 stagger-children">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 group">
                    <CheckCircle2 className="h-5 w-5 text-[#00C896] shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="text-[#F0F0FF] transition-colors duration-150 group-hover:text-[#F0F0FF]">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 animate-fade-up" style={{ animationDelay: '400ms' }}>
                <Link to="/register">
                  <Button size="lg">
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right — score demo card */}
            <div className="relative animate-fade-up" style={{ animationDelay: '150ms' }}>
              <Card className="border-[#1E1E2E] overflow-hidden">
                {/* Gradient top bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#6C63FF] to-[#00D4FF]" />
                <CardHeader>
                  <CardTitle>Readiness Score</CardTitle>
                  <CardDescription>Your overall developer readiness</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Animated SVG ring */}
                  <div className="flex items-center justify-center">
                    <div className="relative flex h-48 w-48 items-center justify-center">
                      <svg className="h-48 w-48 -rotate-90 transform" viewBox="0 0 128 128">
                        <circle cx="64" cy="64" r="56" stroke="#1E1E2E" strokeWidth="10" fill="none" />
                        <circle
                          cx="64" cy="64" r="56"
                          stroke="url(#heroScoreGrad)"
                          strokeWidth="10" fill="none"
                          strokeLinecap="round"
                          strokeDasharray="274 352"
                          style={{ animation: 'ringDraw 1400ms cubic-bezier(0.4,0,0.2,1) 400ms both' }}
                        />
                        <defs>
                          <linearGradient id="heroScoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#6C63FF" />
                            <stop offset="100%" stopColor="#00D4FF" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div
                        className="absolute text-center animate-fade-up"
                        style={{ animationDelay: '900ms' }}
                      >
                        <span className="text-5xl font-bold font-score gradient-text-violet-cyan">78</span>
                        <span className="text-2xl font-score gradient-text-violet-cyan">%</span>
                        <p className="mt-1 text-sm text-[#8888AA]">Advanced</p>
                      </div>
                    </div>
                  </div>

                  {/* Mini stat cards */}
                  <div className="mt-6 grid grid-cols-2 gap-4 stagger-children">
                    <div className="rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-3 text-center transition-all duration-200 hover:-translate-y-[2px] hover:border-[#6C63FF30] hover:shadow-[0_4px_20px_rgba(108,99,255,0.1)]">
                      <p className="text-2xl font-bold font-score text-[#6C63FF]">85%</p>
                      <p className="text-xs text-[#8888AA]">Technical Skills</p>
                    </div>
                    <div className="rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-3 text-center transition-all duration-200 hover:-translate-y-[2px] hover:border-[#00D4FF30] hover:shadow-[0_4px_20px_rgba(0,212,255,0.1)]">
                      <p className="text-2xl font-bold font-score text-[#00D4FF]">72%</p>
                      <p className="text-xs text-[#8888AA]">Soft Skills</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Ambient glow behind card */}
              <div className="absolute -inset-4 -z-10 rounded-2xl bg-[#6C63FF] opacity-[0.04] blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOR INSTRUCTORS
         ══════════════════════════════════════ */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          <div className="mx-auto max-w-2xl text-center animate-fade-up">
            <Badge variant="outline" className="mb-4 border-[#1E1E2E] text-[#8888AA]">
              <Users className="mr-1 h-3 w-3" />
              For Instructors
            </Badge>
            <h2 className="text-balance text-3xl font-bold tracking-tight text-[#F0F0FF] md:text-4xl">
              Powerful Tools for Training Programs
            </h2>
            <p className="mt-4 text-[#8888AA]">
              Monitor trainee progress, identify areas needing attention, and generate
              comprehensive reports with our instructor dashboard.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3 stagger-children">
            <Card className="group">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#6C63FF15] transition-all duration-200 group-hover:bg-[#6C63FF25] group-hover:scale-110">
                  <Users className="h-5 w-5 text-[#6C63FF]" />
                </div>
                <CardTitle className="transition-colors duration-200 group-hover:text-[#6C63FF]">
                  Trainee Management
                </CardTitle>
                <CardDescription>
                  Invite trainees, organize cohorts, and track individual progress
                  across all evaluation modules.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#00D4FF15] transition-all duration-200 group-hover:bg-[#00D4FF25] group-hover:scale-110">
                  <BarChart3 className="h-5 w-5 text-[#00D4FF]" />
                </div>
                <CardTitle className="transition-colors duration-200 group-hover:text-[#00D4FF]">
                  Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  Visualize cohort performance, identify trends, and make data-driven
                  decisions about your training program.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group">
              <CardHeader>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#00C89615] transition-all duration-200 group-hover:bg-[#00C89625] group-hover:scale-110">
                  <FileText className="h-5 w-5 text-[#00C896]" />
                </div>
                <CardTitle className="transition-colors duration-200 group-hover:text-[#00C896]">
                  Exportable Reports
                </CardTitle>
                <CardDescription>
                  Generate PDF and CSV reports for individual trainees or entire
                  cohorts with detailed breakdowns.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          CTA
         ══════════════════════════════════════ */}
      <section className="relative border-t border-[#1E1E2E] py-20 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center animate-fade-up">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-[#F0F0FF] md:text-4xl">
            Ready to Measure Your Developer Readiness?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[#8888AA]">
            Join thousands of developers who have improved their skills and
            landed their dream jobs with NexusMG.
          </p>
          <div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            <Link to="/register">
              <Button size="lg" className="gap-2">
                Create Free Account
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient glow */}
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[600px] rounded-full bg-[#6C63FF] opacity-[0.06] blur-[100px]"
            style={{ animation: 'logoBreathe 5s ease-in-out infinite' }}
          />
        </div>
      </section>

    </div>
  )
}
