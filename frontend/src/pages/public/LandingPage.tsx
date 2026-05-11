import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
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
  AlertCircle,
  TrendingUp,
  Search,
  Mail,
  Phone,
  Globe,
} from 'lucide-react'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton'
import { useAuthStore } from '@/stores/authStore'

const features = [
  { 
    icon: Github, 
    title: 'GitHub Forensics', 
    analyzes: 'Commit patterns, PR etiquette, and repo complexity.',
    outputs: 'Professional signal score and security audit.',
    why: 'Proves you can contribute to production-grade engineering teams.'
  },
  { 
    icon: FileText, 
    title: 'ATS-Optimized CV Audit', 
    analyzes: 'Keyword density, impact verbs, and structural readability.',
    outputs: 'ATS compatibility score and content improvements.',
    why: 'Stops your resume from being discarded by automated filters.'
  },
  { 
    icon: Linkedin, 
    title: 'LinkedIn Signal SEO', 
    analyzes: 'Profile SEO, engagement signals, and professional branding.',
    outputs: 'Visibility audit and networking roadmap.',
    why: 'Ensures you appear in the top 10% of recruiter search results.'
  },
  { 
    icon: Lightbulb, 
    title: 'Architecture Validation', 
    analyzes: 'System design, scalability, and design patterns.',
    outputs: 'Architectural depth score and optimization tips.',
    why: 'Demonstrates you understand the "why" behind the code.'
  },
  { 
    icon: MessageSquare, 
    title: 'Technical Mock Interviews', 
    analyzes: 'Real-time technical articulation and problem-solving.',
    outputs: 'Communication score and concept mastery report.',
    why: 'Bridges the gap between coding skills and interview success.'
  },
  { 
    icon: Languages, 
    title: 'English Proficiency', 
    analyzes: 'Grammar, fluency, and professional coherence.',
    outputs: 'CEFR-aligned fluency rating.',
    why: 'Critical for global remote-work readiness.'
  },
]

export function LandingPage() {
  const navigate = useNavigate()
  const { googleLogin, clearError } = useAuthStore()

  const handleGoogleSuccess = useCallback(
    async (credential: string) => {
      try {
        clearError()
        await googleLogin(credential)
        const { user } = useAuthStore.getState()
        toast.success('Welcome!')
        if (user?.role === 'instructor' || user?.role === 'admin') {
          navigate('/instructor')
        } else {
          navigate('/dashboard')
        }
      } catch {
        toast.error(useAuthStore.getState().error || 'Google sign-in failed. Please try again.')
      }
    },
    [clearError, googleLogin, navigate]
  )

  return (
    <div className="flex flex-col">

      {/* ══════════════════════════════════════
          1. HERO (CRITICAL)
         ══════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <ScrollReveal once={true} threshold={0.05}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="animate-fade-up" style={{ animationDelay: '0ms' }}>
                <Badge
                  variant="secondary"
                  className="mb-6 border-[#6C63FF30] bg-[#6C63FF15] text-[#6C63FF] transition-all duration-200 hover:bg-[#6C63FF25]"
                >
                  <Zap className="mr-1 h-3 w-3" />
                  The New Standard for Developer Assessment
                </Badge>
              </div>

              <h1
                className="text-balance text-4xl font-bold tracking-tight text-[#F0F0FF] md:text-6xl animate-fade-up"
                style={{ animationDelay: '80ms' }}
              >
                Quantify your readiness for the{' '}
                <span className="gradient-text-violet-cyan">
                  Engineering Market.
                </span>
              </h1>

              <p
                className="mt-6 text-pretty text-lg text-[#8888AA] md:text-xl animate-fade-up"
                style={{ animationDelay: '160ms' }}
              >
                NexusMG audits your code, communication, and professional credentials to provide a data-driven benchmark of your employability. Stop guessing why you aren’t getting interviews.
              </p>

              <div
                className="mt-10 flex w-full max-w-md flex-col items-stretch justify-center gap-3 sm:max-w-none sm:flex-row sm:items-start sm:gap-4 animate-fade-up mx-auto sm:mx-0"
                style={{ animationDelay: '240ms' }}
              >
                <Link to="/register" className="sm:shrink-0">
                  <Button size="lg" className="gap-2 min-w-[200px] w-full sm:w-auto">
                    Get Your Readiness Score
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/samples" className="sm:shrink-0">
                  <Button size="lg" variant="outline" className="min-w-[160px] w-full sm:w-auto">
                    View Sample Audit
                  </Button>
                </Link>
                <div className="w-full min-w-0 sm:max-w-[260px] sm:pt-0.5">
                  <GoogleAuthButton onSuccess={handleGoogleSuccess} label="Sign in with Google" />
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div
            className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6C63FF] opacity-[0.07] blur-[120px]"
            style={{ animation: 'logoBreathe 6s ease-in-out infinite' }}
          />
        </div>
      </section>

      {/* ══════════════════════════════════════
          2. PROBLEM SECTION
         ══════════════════════════════════════ */}
      <section className="py-20 bg-[#0A0A0F]/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="mx-auto max-w-2xl text-center animate-fade-up">
              <h2 className="text-3xl font-bold tracking-tight text-[#F0F0FF] md:text-4xl">
                The "Black Hole" of Junior Applications.
              </h2>
              <p className="mt-4 text-[#8888AA]">
                Applying shouldn't be a shot in the dark. Most developers fail because of invisible red flags.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4 stagger-children">
            {[
              { title: 'Invisible CV Red Flags', desc: 'ATS systems rejecting you for formatting, not skill.', icon: AlertCircle },
              { title: 'Low-Signal GitHubs', desc: 'Repos filled with tutorials that recruiters ignore.', icon: Github },
              { title: 'LinkedIn Ghosting', desc: 'Profiles that don\'t trigger the right algorithmic signals.', icon: Search },
              { title: 'The Communication Gap', desc: 'Failing because you can\'t articulate why you built it.', icon: MessageSquare },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-[#111118] border border-[#1E1E2E] card-hover-lift group">
                <item.icon className="h-8 w-8 text-red-500 mb-4 transition-transform group-hover:scale-110" />
                <h3 className="text-lg font-semibold text-[#F0F0FF] mb-2">{item.title}</h3>
                <p className="text-sm text-[#8888AA]">{item.desc}</p>
              </div>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          3. SOLUTION (HOW IT WORKS)
         ══════════════════════════════════════ */}
      <section className="py-20 md:py-32 border-y border-[#1E1E2E]">
        <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#F0F0FF] md:text-4xl mb-16 animate-fade-up">
            The NexusMG Evaluation Pipeline
          </h2>
          <div className="grid gap-8 md:grid-cols-4 relative stagger-children">
            {[
              { step: '01', title: 'Ingest', desc: 'Sync GitHub, LinkedIn, and CV.' },
              { step: '02', title: 'Audit', desc: 'Agents analyze code and narrative.' },
              { step: '03', title: 'Stress Test', desc: 'Simulated interviews & fluency tests.' },
              { step: '04', title: 'Benchmark', desc: 'Compare against market requirements.' },
            ].map((item, i) => (
              <div key={i} className="relative z-10 group">
                <div className="text-5xl font-black text-[#6C63FF20] mb-[-25px] select-none transition-all group-hover:text-[#6C63FF40] group-hover:scale-110">{item.step}</div>
                <h3 className="text-xl font-bold text-[#F0F0FF] mb-2">{item.title}</h3>
                <p className="text-[#8888AA] text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════
          4. REAL OUTPUT DEMO (MANDATORY)
         ══════════════════════════════════════ */}
      <section className="py-20 md:py-32">
        <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <h2 className="text-3xl font-bold text-[#F0F0FF] mb-6">Actionable Insights, Not Generic Badges.</h2>
              <p className="text-[#8888AA] mb-8 leading-relaxed">
                We don't just "check" your profile. We execute a multi-layered analysis to calculate your Developer Readiness Score (DRS).
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 group">
                  <CheckCircle2 className="h-5 w-5 text-[#00C896] mt-1 transition-transform group-hover:scale-125" />
                  <span className="text-[#F0F0FF]">Deep GitHub Forensic Analysis</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <CheckCircle2 className="h-5 w-5 text-[#00C896] mt-1 transition-transform group-hover:scale-125" />
                  <span className="text-[#F0F0FF]">ATS-Compatibility CV Stress Testing</span>
                </li>
                <li className="flex items-start gap-3 group">
                  <CheckCircle2 className="h-5 w-5 text-[#00C896] mt-1 transition-transform group-hover:scale-125" />
                  <span className="text-[#F0F0FF]">AI-Simulated Technical Interviews</span>
                </li>
              </ul>
            </div>
            <Card className="border-[#6C63FF30] bg-[#0A0A0F] font-mono text-xs overflow-hidden animate-card-entry shadow-[0_0_50px_rgba(108,99,255,0.1)]">
               <div className="bg-[#1E1E2E] p-2 flex gap-2 border-b border-[#6C63FF30]">
                 <div className="w-3 h-3 rounded-full bg-red-500/50" />
                 <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                 <div className="w-3 h-3 rounded-full bg-green-500/50" />
                 <span className="ml-2 text-[#8888AA]">nexus_audit_report.json</span>
               </div>
               <CardContent className="p-6 space-y-4 text-[#8888AA]">
                 <div>
                   <p className="text-[#6C63FF] font-bold text-base mb-1 animate-pulse">OVERALL READINESS SCORE: 72/100 (Market-Ready)</p>
                   <p>[+] Target: Junior/Mid-Level Fullstack</p>
                 </div>
                 <div className="space-y-2">
                   <p className="text-[#F0F0FF] font-bold">[+] GitHub Evaluation: 84/100</p>
                   <p className="pl-4 text-green-500/80">- Signal: Consistent commit history; high documentation ratio.</p>
                   <p className="pl-4 text-red-400/80">- Red Flag: 3 repositories contain hardcoded API keys.</p>
                   <p className="pl-4 text-[#6C63FF]">- Action: Implement Env Variables in `nexus-api` repo.</p>
                 </div>
                 <div className="space-y-2">
                   <p className="text-[#F0F0FF] font-bold">[+] CV Audit: 58/100</p>
                   <p className="pl-4 text-red-400/80">- Issue: Lacks "Impact Verbs". Describes tasks, not outcomes.</p>
                   <p className="pl-4 text-[#6C63FF]">- Fix: Change "Built a dashboard" to "Optimized dashboard queries, reducing latency by 40%".</p>
                 </div>
               </CardContent>
            </Card>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════
          5. CORE FEATURE BLOCKS
         ══════════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-[#111118]/50 border-y border-[#1E1E2E]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ScrollReveal className="text-center mb-16">
             <h2 className="text-3xl font-bold text-[#F0F0FF] animate-fade-up">Unrivaled Evaluation Depth</h2>
          </ScrollReveal>
          <ScrollReveal className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger-children">
            {features.map((feature, i) => (
              <Card key={i} className="group border-[#1E1E2E] hover:border-[#6C63FF40] bg-[#0A0A0F] card-hover-lift">
                <CardHeader>
                  <div className="mb-4 h-12 w-12 flex items-center justify-center rounded-xl bg-[#6C63FF15] group-hover:bg-[#6C63FF25] transition-all group-hover:scale-110">
                    <feature.icon className="h-6 w-6 text-[#6C63FF]" />
                  </div>
                  <CardTitle className="text-[#F0F0FF] group-hover:text-[#6C63FF] transition-colors">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm">
                    <p className="text-[#F0F0FF] font-semibold mb-1">What it analyzes:</p>
                    <p className="text-[#8888AA]">{feature.analyzes}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-[#F0F0FF] font-semibold mb-1">What it outputs:</p>
                    <p className="text-[#8888AA]">{feature.outputs}</p>
                  </div>
                  <div className="text-sm bg-[#6C63FF08] p-3 rounded-lg border border-[#6C63FF15] group-hover:bg-[#6C63FF12] transition-colors">
                    <p className="text-[#6C63FF] italic font-medium">Why it matters: <span className="text-[#8888AA] not-italic font-normal">{feature.why}</span></p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollReveal>
        </div>
      </section>

      {/* ══════════════════════════════════════
          6. READINESS SCORE SYSTEM
         ══════════════════════════════════════ */}
      <section className="py-20 md:py-32">
        <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative animate-fade-up">
                 <div className="absolute -inset-4 bg-[#00D4FF] opacity-[0.05] blur-3xl rounded-full" />
                 <Card className="relative border-[#1E1E2E] bg-[#0A0A0F] p-8 overflow-hidden card-hover-lift">
                    <div className="flex justify-between items-end mb-8">
                       <div>
                          <p className="text-[#8888AA] text-sm mb-1 uppercase tracking-wider font-bold">Scoring Weightage</p>
                          <h3 className="text-2xl font-bold text-[#F0F0FF]">The DRS Algorithm</h3>
                       </div>
                       <TrendingUp className="h-8 w-8 text-[#00D4FF] animate-pulse" />
                    </div>
                    <div className="space-y-6 stagger-children">
                       {[
                         { label: 'GitHub Activity (Signal Strength)', w: '40%', color: '#6C63FF' },
                         { label: 'Technical Communication (Mock Interviews)', w: '25%', color: '#00D4FF' },
                         { label: 'Credentials (CV & LinkedIn)', w: '15%', color: '#00C896' },
                         { label: 'System Architecture', w: '10%', color: '#FFD700' },
                         { label: 'Language Proficiency', w: '10%', color: '#FF7E5F' },
                       ].map((item, i) => (
                         <div key={i} className="space-y-2">
                           <div className="flex justify-between text-sm">
                             <span className="text-[#F0F0FF]">{item.label}</span>
                             <span className="text-[#8888AA]">{item.w}</span>
                           </div>
                           <div className="h-2 w-full bg-[#1E1E2E] rounded-full overflow-hidden">
                             <div className="h-full rounded-full" style={{ width: item.w, backgroundColor: item.color }} />
                           </div>
                         </div>
                       ))}
                    </div>
                 </Card>
              </div>
              <div className="order-1 lg:order-2 animate-fade-up">
                <Badge variant="outline" className="mb-4 text-[#00D4FF] border-[#00D4FF20] animate-pulse">The Key Differentiator</Badge>
                <h2 className="text-3xl font-bold text-[#F0F0FF] mb-6 md:text-4xl">Science-Backed Career Benchmarking.</h2>
                <p className="text-[#8888AA] text-lg leading-relaxed mb-8">
                   Our Developer Readiness Score (DRS) removes subjectivity. It's a proprietary algorithm weighted against current global engineering standards.
                </p>
                <div className="grid gap-6">
                   <div className="flex gap-4 group">
                      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-[#111118] border border-[#1E1E2E] text-[#00D4FF] font-bold transition-transform group-hover:scale-110">1</div>
                      <div>
                         <h4 className="text-[#F0F0FF] font-bold">Standardized Ranking</h4>
                         <p className="text-[#8888AA] text-sm">Compare your progress against a global pool of applicants.</p>
                      </div>
                   </div>
                   <div className="flex gap-4 group">
                      <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-[#111118] border border-[#1E1E2E] text-[#00D4FF] font-bold transition-transform group-hover:scale-110">2</div>
                      <div>
                         <h4 className="text-[#F0F0FF] font-bold">Evidence-Based Reliability</h4>
                         <p className="text-[#8888AA] text-sm">Every point in your score is tied to a specific commit, sentence, or design choice.</p>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════
          7. BEFORE vs AFTER
         ══════════════════════════════════════ */}
      <section className="py-20 md:py-32 bg-[#0A0A0F]/50 border-t border-[#1E1E2E]">
        <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16 animate-fade-up">
              <h2 className="text-3xl font-bold text-[#F0F0FF]">The Transformation Journey</h2>
           </div>
           <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto stagger-children">
              <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/5 relative overflow-hidden card-hover-lift group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-125"><AlertCircle className="h-12 w-12" /></div>
                 <h4 className="text-red-400 font-bold mb-4 uppercase text-sm">Before NexusMG</h4>
                 <p className="text-[#8888AA] italic">"I applied to 200 jobs and haven't heard back. I keep learning more frameworks but nothing changes. I don't know what I'm doing wrong."</p>
              </div>
              <div className="p-8 rounded-2xl border border-green-500/20 bg-green-500/5 relative overflow-hidden card-hover-lift group">
                 <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-125"><CheckCircle2 className="h-12 w-12" /></div>
                 <h4 className="text-green-400 font-bold mb-4 uppercase text-sm">After NexusMG</h4>
                 <p className="text-[#8888AA] italic">"The audit showed my CV wasn't ATS-friendly and my GitHub had security leaks. I fixed those 4 specific points and landed 3 interviews in two weeks."</p>
              </div>
           </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════
          8. FOR WHO & 9. TRUST
         ══════════════════════════════════════ */}
      <section className="py-20 md:py-32">
        <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
           <div className="grid lg:grid-cols-2 gap-16">
              <div className="animate-fade-up">
                 <h2 className="text-3xl font-bold text-[#F0F0FF] mb-6">Built for the Modern Workforce.</h2>
                 <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-[#111118] border border-[#1E1E2E] card-hover-lift group">
                       <h4 className="text-[#6C63FF] font-bold mb-2 group-hover:translate-x-1 transition-transform">Ambitious Junior Developers</h4>
                       <p className="text-[#8888AA] text-sm">Standardize your portfolio to compete with experienced developers and remove the "Junior" stigma.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-[#111118] border border-[#1E1E2E] card-hover-lift group">
                       <h4 className="text-[#00D4FF] font-bold mb-2 group-hover:translate-x-1 transition-transform">Bootcamps & Instructors</h4>
                       <p className="text-[#8888AA] text-sm">Track student progress with high-fidelity analytics and ensure every graduate is truly job-ready.</p>
                    </div>
                 </div>
              </div>
              <div className="animate-fade-up" style={{ animationDelay: '100ms' }}>
                 <h2 className="text-3xl font-bold text-[#F0F0FF] mb-6">Market Validation.</h2>
                 <div className="space-y-8">
                    <div className="p-6 rounded-2xl border-l-4 border-[#6C63FF] bg-[#111118] card-hover-lift group">
                       <p className="text-[#F0F0FF] mb-4 italic text-sm transition-colors group-hover:text-white">"NexusMG gave me the exact roadmap I needed. It's like having a senior engineer auditing your career 24/7."</p>
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6C63FF] to-[#00D4FF] animate-pulse" />
                          <div>
                             <p className="text-xs font-bold text-[#F0F0FF]">Alex Chen</p>
                             <p className="text-[10px] text-[#8888AA]">Frontend Engineer @ TechGlobal</p>
                          </div>
                       </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 stagger-children">
                       <div className="p-4 rounded-xl border border-[#1E1E2E] text-center card-hover-lift">
                          <p className="text-xl font-bold text-[#F0F0FF]">15k+</p>
                          <p className="text-[10px] text-[#8888AA] uppercase">Audits Performed</p>
                       </div>
                       <div className="p-4 rounded-xl border border-[#1E1E2E] text-center card-hover-lift">
                          <p className="text-xl font-bold text-[#F0F0FF]">85%</p>
                          <p className="text-[10px] text-[#8888AA] uppercase">Hiring Conversion</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════
          TEAM SECTION
         ══════════════════════════════════════ */}
      <section className="py-20 border-t border-[#1E1E2E] bg-[#111118]/50">
        <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-up">
            <Badge variant="secondary" className="mb-4 border-[#6C63FF30] bg-[#6C63FF15] text-[#6C63FF]">
              <Users className="mr-1 h-3 w-3" />
              The Team
            </Badge>
            <h2 className="text-3xl font-bold text-[#F0F0FF]">Built by Developers, for Developers.</h2>
            <p className="mt-3 text-[#8888AA]">The minds behind NexusMG.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto stagger-children">
            {/* Mohammad */}
            <div className="group p-6 rounded-2xl bg-[#0A0A0F] border border-[#1E1E2E] hover:border-[#6C63FF40] card-hover-lift">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-[#6C63FF15] flex items-center justify-center text-[#6C63FF] font-bold text-lg border border-[#6C63FF30]">
                  M
                </div>
                <div>
                  <h3 className="font-bold text-[#F0F0FF] group-hover:text-[#6C63FF] transition-colors">Mohammad Abo Al Ghozlan</h3>
                  <p className="text-xs text-[#7a7a99]">Co-Founder & Developer</p>
                </div>
              </div>
              <div className="space-y-2">
                <a href="mailto:abo.al.ghozlan.mohammad@gmail.com"
                  className="flex items-center gap-2 text-sm text-[#8888AA] hover:text-[#6C63FF] transition-colors duration-200"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  abo.al.ghozlan.mohammad@gmail.com
                </a>
                <a href="tel:+96181985614"
                  className="flex items-center gap-2 text-sm text-[#8888AA] hover:text-[#6C63FF] transition-colors duration-200"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  +961 81 985 614
                </a>
                <a href="https://www.linkedin.com/in/mohammad-abo-al-ghozlan/" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-[#8888AA] hover:text-[#6C63FF] transition-colors duration-200">
                  <Linkedin className="h-4 w-4 shrink-0" />
                  linkedin.com/in/mohammad-abo-al-ghozlan
                </a>
                <a href="https://mohammad-ghozlan.vercel.app/" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-[#8888AA] hover:text-[#6C63FF] transition-colors duration-200">
                  <Globe className="h-4 w-4 shrink-0" />
                  mohammad-ghozlan.vercel.app
                </a>
              </div>
            </div>

            {/* Somaya */}
            <div className="group p-6 rounded-2xl bg-[#0A0A0F] border border-[#1E1E2E] hover:border-[#6C63FF40] card-hover-lift">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-12 w-12 rounded-xl bg-[#6C63FF15] flex items-center justify-center text-[#6C63FF] font-bold text-lg border border-[#6C63FF30]">
                  S
                </div>
                <div>
                  <h3 className="font-bold text-[#F0F0FF] group-hover:text-[#6C63FF] transition-colors">Somaya Al Minawi</h3>
                  <p className="text-xs text-[#7a7a99]">Co-Founder & Developer</p>
                </div>
              </div>
              <div className="space-y-2">
                <a href="mailto:sumayaminawi@gmail.com"
                  className="flex items-center gap-2 text-sm text-[#8888AA] hover:text-[#6C63FF] transition-colors duration-200"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  sumayaminawi@gmail.com
                </a>
                <a href="tel:+96178979310"
                  className="flex items-center gap-2 text-sm text-[#8888AA] hover:text-[#6C63FF] transition-colors duration-200"
                >
                  <Phone className="h-4 w-4 shrink-0" />
                  +961 78 979 310
                </a>
                <a href="https://www.linkedin.com/in/sumaya-minawi/" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-[#8888AA] hover:text-[#6C63FF] transition-colors duration-200">
                  <Linkedin className="h-4 w-4 shrink-0" />
                  linkedin.com/in/sumaya-minawi
                </a>
                <a href="https://sumaya-minawi.vercel.app/" target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-[#8888AA] hover:text-[#6C63FF] transition-colors duration-200">
                  <Globe className="h-4 w-4 shrink-0" />
                  sumaya-minawi.vercel.app
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ══════════════════════════════════════
          10. FINAL CTA
         ══════════════════════════════════════ */}
      <section className="relative border-t border-[#1E1E2E] py-20 overflow-hidden bg-[#6C63FF]/5">
        <ScrollReveal className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="text-balance text-4xl font-extrabold tracking-tight text-[#F0F0FF] md:text-5xl animate-fade-up">
             Stop guessing your value.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[#8888AA] text-lg animate-fade-up" style={{ animationDelay: '60ms' }}>
             Join thousands of developers quantifying their readiness and landing roles at top-tier companies.
          </p>
          <div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-up"
            style={{ animationDelay: '120ms' }}
          >
            <Link to="/register">
              <Button size="lg" className="gap-2 h-14 px-10 text-lg">
                Start Your Audit Free
                <ArrowRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-[#8888AA] text-sm animate-fade-up" style={{ animationDelay: '180ms' }}>No credit card required. Benchmarking takes 2 minutes.</p>
        </ScrollReveal>

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
