import { Outlet, useLocation } from 'react-router-dom'
import { ErrorBoundary } from '../../components/ErrorBoundary'
import { Logo } from '../../components/Logo'
import { SemesterSwitcher } from './SemesterSwitcher'
import { SemesterViewProvider } from './SemesterViewContext'
import { SidebarNav } from './SidebarNav'
import { BottomNav } from './BottomNav'
import { NAV_ITEMS } from './navItems'
import { GradeDataVersionProvider } from '../grades/GradeDataVersionContext'
import { QuickAddProvider } from '../grades/QuickAddContext'
import { QuickAddFab } from '../grades/QuickAddFab'

function currentSectionLabel(pathname: string): string {
  if (pathname.startsWith('/app/subjects/')) return 'Fach'
  const match = [...NAV_ITEMS].reverse().find((item) => pathname.startsWith(item.to) && (item.to !== '/app' || pathname === '/app'))
  return match?.label ?? ''
}

export function AppShell() {
  const location = useLocation()

  return (
    <SemesterViewProvider>
      <GradeDataVersionProvider>
        <QuickAddProvider>
          <div className="min-h-svh bg-bg md:flex">
            <SidebarNav />

            <div className="min-w-0 flex-1">
              <header className="sticky top-0 z-10 border-b border-border bg-bg/95 backdrop-blur">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-2 md:hidden">
                    <Logo size={28} />
                    <p className="text-base font-bold text-ink">Notentracker</p>
                  </div>
                  <p className="hidden text-sm font-medium text-ink-soft md:block">
                    {currentSectionLabel(location.pathname)}
                  </p>
                  <SemesterSwitcher />
                </div>
              </header>

              <main className="mx-auto w-full max-w-5xl px-5 py-6 pb-24 md:pb-10">
                <ErrorBoundary key={location.pathname} variant="inline">
                  <Outlet />
                </ErrorBoundary>
              </main>
            </div>

            <BottomNav />
            <QuickAddFab />
          </div>
        </QuickAddProvider>
      </GradeDataVersionProvider>
    </SemesterViewProvider>
  )
}
