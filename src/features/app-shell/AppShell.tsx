import { GraduationCap } from 'lucide-react'
import { Outlet } from 'react-router-dom'
import { SemesterSwitcher } from './SemesterSwitcher'
import { SemesterViewProvider } from './SemesterViewContext'
import { GradeDataVersionProvider } from '../grades/GradeDataVersionContext'
import { QuickAddProvider } from '../grades/QuickAddContext'
import { QuickAddFab } from '../grades/QuickAddFab'

export function AppShell() {
  return (
    <SemesterViewProvider>
      <GradeDataVersionProvider>
        <QuickAddProvider>
          <div className="min-h-svh bg-bg">
            <header className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur">
              <div className="mx-auto flex w-full max-w-md items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-soft text-mint">
                    <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="text-base font-bold text-ink">Notentracker</p>
                </div>
                <SemesterSwitcher />
              </div>
            </header>

            <main className="mx-auto w-full max-w-md px-5 py-6 pb-24">
              <Outlet />
            </main>

            <QuickAddFab />
          </div>
        </QuickAddProvider>
      </GradeDataVersionProvider>
    </SemesterViewProvider>
  )
}
