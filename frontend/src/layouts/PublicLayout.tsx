import { Outlet, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Cpu, Mail, Phone } from 'lucide-react'
import logo from '../assets/logo.png'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0F] nexus-grid-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-[#1E1E2E] bg-[#0A0A0F]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                <img src={logo} alt="NexusMG" className='h-9 w-9 object-contain' />
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-[#6C63FF] blur-sm opacity-60" />
            </div>
            <span className="text-xl font-bold text-[#F0F0FF]">NexusMG</span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="text-[#8888AA] hover:text-[#F0F0FF]">Sign In</Button>
            </Link>
            <Link to="/register">
              <Button>Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E1E2E] bg-[#111118] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

          {/* Top Row */}
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:items-start">

            {/* Left — Logo */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                <img src={logo} alt="NexusMG" className='h-9 w-9 object-contain' />
              </div>
              <div>
                <span className="text-lg font-bold text-[#F0F0FF]">NexusMG</span>
                <p className="text-xs text-[#44445A]">Evaluate. Improve. Succeed.</p>
              </div>
            </div>

            {/* Center — Tagline */}
            <div className="text-center">
              <p className="text-sm font-semibold text-[#8888AA]">AI-Powered Developer Readiness Platform</p>
              <p className="mt-1 text-xs text-[#44445A]">Helping trainees become job-ready through AI-driven evaluation</p>
            </div>

            {/* Right — Quick Links */}
            <div className="flex flex-col items-end gap-2 text-sm text-[#44445A]">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6C63FF]">Platform</p>
              <span className="hover:text-[#F0F0FF] transition-colors duration-200 cursor-pointer">CV Evaluation</span>
              <span className="hover:text-[#F0F0FF] transition-colors duration-200 cursor-pointer">GitHub Analysis</span>
              <span className="hover:text-[#F0F0FF] transition-colors duration-200 cursor-pointer">Mock Interview</span>
              <span className="hover:text-[#F0F0FF] transition-colors duration-200 cursor-pointer">Readiness Score</span>
            </div>

          </div>

          {/* Divider */}
          <div className="my-8 border-t border-[#1E1E2E]" />

          {/* Team Info Row */}
          <div className="flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">

            {/* Mohammad */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#44445A]">
              <span className="font-medium text-[#8888AA]">Mohammad Abo Al Ghozlan</span>
              
              <a  href="mailto:abo.al.ghozlan.mohammad@gmail.com"
                className="flex items-center gap-1.5 hover:text-[#6C63FF] transition-colors duration-200"
              >
                <Mail className="h-3.5 w-3.5" />
                abo.al.ghozlan.mohammad@gmail.com
              </a>
              
              <a  href="tel:+96181985614"
                className="flex items-center gap-1.5 hover:text-[#6C63FF] transition-colors duration-200"
              >
                <Phone className="h-3.5 w-3.5" />
                +961 81 985 614
              </a>
            </div>

            {/* Somaya */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#44445A]">
              <span className="font-medium text-[#8888AA]">Somaya Al Minawi</span>
              
              <a href="mailto:sumayaminawi@gmail.com"
                className="flex items-center gap-1.5 hover:text-[#6C63FF] transition-colors duration-200"
              >
                <Mail className="h-3.5 w-3.5" />
                sumayaminawi@gmail.com
              </a>
              
              <a  href="tel:+96178979310"
                className="flex items-center gap-1.5 hover:text-[#6C63FF] transition-colors duration-200"
              >
                <Phone className="h-3.5 w-3.5" />
                +961 78 979 310
              </a>
            </div>

          </div>

          {/* Divider */}
          <div className="my-6 border-t border-[#1E1E2E]" />

          {/* Copyright */}
          <div className="text-center">
            <p className="text-xs text-[#44445A]">
              © {new Date().getFullYear()} NexusMG. All rights reserved.
            </p>
          </div>

        </div>
      </footer>

    </div>
  )
}