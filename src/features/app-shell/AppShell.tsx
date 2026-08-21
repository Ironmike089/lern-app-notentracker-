import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import type { Semester } from '../../domain/types'
import { getCurrentSemester } from '../../services/schoolYearService'
import { Dashboard } from '../dashboard/Dashboard'

export function AppShell() {
  const [semester, setSemester] = useState<Semester | undefined>()

  useEffect(() => {
    let active = true
    getCurrentSemester().then((s) => {
      if (active) setSemester(s)
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-svh bg-bg">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-soft text-mint">
              <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <p className="text-base font-bold text-ink">Notentracker</p>
          </div>
          {semester && (
            <span className="rounded-full bg-bg-card px-2.5 py-1 text-xs font-medium text-ink-soft">
              {semester.label}
            </span>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-md px-5 py-6">
        <Dashboard />
      </main>
    </div>
  )
}
