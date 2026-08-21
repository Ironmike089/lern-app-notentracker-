import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { getOnboardingCompleted } from '../services/onboardingService'

type Status = 'checking' | 'onboarding' | 'app'

export function RootGate() {
  const [status, setStatus] = useState<Status>('checking')

  useEffect(() => {
    let active = true
    getOnboardingCompleted().then((completed) => {
      if (active) setStatus(completed ? 'app' : 'onboarding')
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

  return <Navigate to={status === 'app' ? '/app' : '/onboarding'} replace />
}
