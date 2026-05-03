import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import logo from '../assets/logo.png'
import {
  Cpu,
  LayoutDashboard,
  FileText,
  Github,
  Linkedin,
  Lightbulb,
  MessageSquare,
  Languages,
  User,
  Users,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { useState, useEffect } from 'react'

const traineeNavItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/cv', label: 'CV Evaluation', icon: FileText },
  { href: '/dashboard/github', label: 'GitHub Analysis', icon: Github },
  { href: '/dashboard/linkedin', label: 'LinkedIn Review', icon: Linkedin },
  { href: '/dashboard/idea', label: 'Idea Pitch', icon: Lightbulb },
  { href: '/dashboard/interview', label: 'Mock Interview', icon: MessageSquare },
  { href: '/dashboard/english', label: 'English Test', icon: Languages },
]

const instructorNavItems = [
  { href: '/instructor', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instructor/trainees', label: 'Trainees', icon: Users },
  { href: '/instructor/analytics', label: 'Analytics', icon: BarChart3 },
]

type SidebarMode = 'full' | 'icon' | 'hidden'

export function DashboardLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('full')

  const navItems = user?.role === 'instructor' || user?.role === 'admin'
    ? instructorNavItems
    : traineeNavItems

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Responsive sidebar mode
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (w >= 1024) {
        setSidebarMode('full')
        setMobileOpen(false)
      } else if (w >= 768) {
        setSidebarMode('icon')
        setMobileOpen(false)
      } else {
        setSidebarMode('hidden')
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  const sidebarWidth = sidebarMode === 'full' ? 'w-64' : sidebarMode === 'icon' ? 'w-[72px]' : 'w-0'
  const mainMargin = sidebarMode === 'full' ? 'md:ml-64' : sidebarMode === 'icon' ? 'md:ml-[72px]' : 'ml-0'

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* ════════════════════════════════════════
          MOBILE HEADER (< md)
         ════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-[#1E1E2E] bg-[#0A0A0F]/95 backdrop-blur-xl px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8888AA] hover:bg-[#6C63FF10] hover:text-[#F0F0FF] transition-colors"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg">
            <img src={logo} alt="NexusMG" className='h-9 w-9 object-contain' />
          </div>
          <span className="font-bold text-[#F0F0FF] text-sm">NexusMG</span>
        </div>
      </header>

      {/* ════════════════════════════════════════
          MOBILE OVERLAY
         ════════════════════════════════════════ */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#0A0A0F]/80 backdrop-blur-sm md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ════════════════════════════════════════
          SIDEBAR
         ════════════════════════════════════════ */}
      <aside
        className={cn(
          // Base
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#1E1E2E] bg-[#111118] transition-all duration-300 ease-in-out",
          // Desktop / Tablet
          "hidden md:flex",
          sidebarWidth,
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-[#1E1E2E] px-4 shrink-0">
          <div className="relative shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg">
              <img src={logo} alt="NexusMG" className='h-9 w-9 object-contain' />
            </div>
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 rounded-full bg-[#6C63FF] blur-sm opacity-60" />
          </div>
          {sidebarMode === 'full' && (
            <span className="text-lg font-bold text-[#F0F0FF] whitespace-nowrap overflow-hidden">NexusMG</span>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="flex flex-col gap-1 nav-stagger">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  title={sidebarMode === 'icon' ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200 relative group",
                    sidebarMode === 'icon' ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                    isActive
                      ? "bg-[#6C63FF15] text-[#F0F0FF] shadow-[inset_0_0_20px_#6C63FF08]"
                      : "text-[#8888AA] hover:text-[#F0F0FF] hover:bg-[#6C63FF08]"
                  )}
                >
                  {/* Active left indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[#6C63FF] shadow-[0_0_8px_#6C63FF] nav-active-indicator" />
                  )}
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#6C63FF]" : "")} />
                  {sidebarMode === 'full' && (
                    <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
                  )}
                  {/* Tooltip for icon mode */}
                  {sidebarMode === 'icon' && (
                    <div className="absolute left-full ml-2 hidden group-hover:flex items-center z-50">
                      <div className="rounded-lg bg-[#1E1E2E] border border-[#2A2A3E] px-3 py-1.5 text-xs font-medium text-[#F0F0FF] shadow-lg whitespace-nowrap">
                        {item.label}
                      </div>
                    </div>
                  )}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        <Separator />

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex px-2 py-2">
          <button
            onClick={() => setSidebarMode(sidebarMode === 'full' ? 'icon' : 'full')}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-[#44445A] hover:text-[#8888AA] hover:bg-[#6C63FF08] transition-colors"
          >
            {sidebarMode === 'full' ? (
              <>
                <ChevronsLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            ) : (
              <ChevronsRight className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* User Section */}
        <div className="p-2 shrink-0">
          {sidebarMode === 'full' ? (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-3">
                <Avatar className="h-9 w-9 ring-2 ring-[#6C63FF30] shrink-0">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-[#F0F0FF]">{user?.full_name}</p>
                  <p className="truncate text-xs text-[#8888AA] capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Link to={user?.role === 'trainee' ? '/dashboard/profile' : '/instructor'} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    <User className="mr-1.5 h-3.5 w-3.5" />
                    Profile
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="h-9 w-9 ring-2 ring-[#6C63FF30]">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback className="text-xs">
                  {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8" title="Logout">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* ════════════════════════════════════════
          MOBILE SIDEBAR DRAWER
         ════════════════════════════════════════ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r border-[#1E1E2E] bg-[#111118] transition-transform duration-300 ease-in-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile logo */}
        <div className="flex h-14 items-center gap-3 border-b border-[#1E1E2E] px-4 shrink-0">
          <div className="relative shrink-0"> 
            <div className="flex h-10 w-10 items-center justify-center rounded-lg">
              <img src={logo} alt="NexusMG" className='h-9 w-9 object-contain' />
            </div>
          </div>
          <span className="text-lg font-bold text-[#F0F0FF]">NexusMG</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-[#8888AA] hover:text-[#F0F0FF] hover:bg-[#6C63FF10] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile nav */}
        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 relative",
                    isActive
                      ? "bg-[#6C63FF15] text-[#F0F0FF] shadow-[inset_0_0_20px_#6C63FF08]"
                      : "text-[#8888AA] hover:text-[#F0F0FF] hover:bg-[#6C63FF08]"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-r-full bg-[#6C63FF] shadow-[0_0_8px_#6C63FF]" />
                  )}
                  <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-[#6C63FF]" : "")} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        <Separator />

        {/* Mobile user */}
        <div className="p-3 shrink-0">
          <div className="flex items-center gap-3 rounded-xl bg-[#0A0A0F] border border-[#1E1E2E] p-3">
            <Avatar className="h-9 w-9 ring-2 ring-[#6C63FF30] shrink-0">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-xs">
                {user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[#F0F0FF]">{user?.full_name}</p>
              <p className="truncate text-xs text-[#8888AA] capitalize">{user?.role}</p>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <Link to={user?.role === 'trainee' ? '/dashboard/profile' : '/instructor'} className="flex-1">
              <Button variant="outline" size="sm" className="w-full text-xs">
                <User className="mr-1.5 h-3.5 w-3.5" />
                Profile
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} className="shrink-0">
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* ════════════════════════════════════════
          MOBILE BOTTOM NAV
         ════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#1E1E2E] bg-[#111118]/95 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-around px-2 py-1">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] font-medium transition-colors min-w-[48px]",
                  isActive
                    ? "text-[#6C63FF]"
                    : "text-[#44445A] hover:text-[#8888AA]"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "drop-shadow-[0_0_6px_#6C63FF]" : "")} />
                <span className="truncate max-w-[56px]">{item.label.split(' ')[0]}</span>
              </Link>
            )
          })}
          {/* More button opens drawer */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-2 text-[10px] font-medium text-[#44445A] hover:text-[#8888AA] transition-colors min-w-[48px]"
          >
            <Menu className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ════════════════════════════════════════
          MAIN CONTENT
         ════════════════════════════════════════ */}
      <main
        className={cn(
          "min-h-screen transition-[margin] duration-300 ease-in-out",
          mainMargin,
          // Add padding for mobile bottom nav & top header
          "pb-20 md:pb-0 pt-0"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in-up">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
