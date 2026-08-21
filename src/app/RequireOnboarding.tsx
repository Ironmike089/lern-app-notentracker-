import { useEffect, useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { getOnboardingCompleted } from '../services/onboardingService'

type Status = 'checking' | 'missing' | 'ok'

/**
 * Guards the /app/* subtree directly, rather than relying on RootGate alone.
 * RootGate only mediates the very first navigation to "/" — a deep-linked
 * or reloaded /app/... URL (e.g. right after "Alle Daten löschen" reloads
 * the page) never passes through it, so without this check the app would
 * try to render Dashboard/Settings/etc. against a wiped database forever
 * instead of sending the user back to onboarding.
 */
export function RequireOnboarding({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    let active = true
    getOnboardingCompleted().then((completed) => {
      if (active) setStatus(completed ? 'ok' : 'missing')
    })
    return () => {
      active = false
    }
  }, [])

  if (status === 'checking') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg">
        <span className="flex h-12 w-12 animate-pulse items-center justify-center rounded-2xl bg-mint-soft text-mint">
          <GraduationCap className="h-6 w-6" strokeWidth={1.75} />
        </span>
      </div>
    )
  }

  if (status === 'missing') return <Navigate to="/onboarding" replace />

  return children
}
