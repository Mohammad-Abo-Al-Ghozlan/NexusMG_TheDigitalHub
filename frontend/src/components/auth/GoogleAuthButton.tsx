import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { GoogleIcon } from '@/components/auth/GoogleIcon'

interface GoogleAuthButtonProps {
  onSuccess: (credential: string) => void
  label?: string
}

function getGoogleClientId(): string {
  const raw = import.meta.env.VITE_GOOGLE_CLIENT_ID
  return typeof raw === 'string' ? raw.trim() : ''
}

export function GoogleAuthButton({ onSuccess, label = 'Continue with Google' }: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const clientId = getGoogleClientId()

  useEffect(() => {
    if (!clientId) {
      setReady(false)
      return
    }

    let attempts = 0
    const init = () => {
      if (!window.google?.accounts?.id) return false
      if (!containerRef.current) return false

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => onSuccess(response.credential),
        ux_mode: 'popup',
      })

      containerRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
      })
      setReady(true)
      return true
    }

    if (init()) return

    const timer = window.setInterval(() => {
      attempts += 1
      if (init() || attempts > 40) {
        window.clearInterval(timer)
      }
    }, 150)

    return () => window.clearInterval(timer)
  }, [onSuccess, clientId])

  if (!clientId) {
    return (
      <div className="w-full space-y-1.5">
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          disabled
          title="Add VITE_GOOGLE_CLIENT_ID to frontend/.env (same Web client ID as backend GOOGLE_CLIENT_ID), then restart npm run dev."
        >
          <GoogleIcon className="shrink-0" />
          Google sign-in not configured
        </Button>
        <p className="text-center text-[10px] leading-snug text-[#5C5C78]">
          Set <span className="font-mono text-[#8888AA]">VITE_GOOGLE_CLIENT_ID</span> in{' '}
          <span className="font-mono text-[#8888AA]">frontend/.env</span> — match backend{' '}
          <span className="font-mono text-[#8888AA]">GOOGLE_CLIENT_ID</span>, then restart the dev server.
        </p>
      </div>
    )
  }

  return (
    <div className="relative w-full min-h-[44px]">
      <div ref={containerRef} className="w-full [&_iframe]:w-full" />
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex w-full items-center justify-center gap-2 rounded-md border border-[#1E1E2E] bg-[#0A0A0F] text-sm text-[#8888AA]">
          <GoogleIcon className="shrink-0" />
          {label}
        </div>
      )}
    </div>
  )
}
