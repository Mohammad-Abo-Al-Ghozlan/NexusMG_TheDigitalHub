import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function calculateReadinessLevel(score: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (score < 25) return 'beginner'
  if (score < 50) return 'intermediate'
  if (score < 75) return 'advanced'
  return 'expert'
}

export function getReadinessColor(level: string): string {
  switch (level) {
    case 'beginner':
      return 'text-red-500'
    case 'intermediate':
      return 'text-yellow-500'
    case 'advanced':
      return 'text-blue-500'
    case 'expert':
      return 'text-green-500'
    default:
      return 'text-neutral-500'
  }
}

export function getScoreColor(score: number): string {
  if (score < 25) return 'text-red-500'
  if (score < 50) return 'text-yellow-500'
  if (score < 75) return 'text-blue-500'
  return 'text-green-500'
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function resolveApiAssetUrl(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith('data:')) return url
  if (/^https?:\/\//i.test(url)) return url

  const apiBase: string | undefined = import.meta.env.VITE_API_URL
  if (apiBase && /^https?:\/\//i.test(apiBase)) {
    try {
      const origin = new URL(apiBase).origin
      return `${origin}${url.startsWith('/') ? '' : '/'}${url}`
    } catch {
      // fall through
    }
  }

  // If the dev server proxies /api, relative paths will still work.
  return url
}
