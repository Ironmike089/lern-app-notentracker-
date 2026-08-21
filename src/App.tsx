import { HashRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RootGate } from './app/RootGate'
import { OnboardingRoute } from './app/OnboardingRoute'
import { AppShell } from './features/app-shell/AppShell'
import { Dashboard } from './features/dashboard/Dashboard'
import { SubjectDetailPage } from './features/subject-detail/SubjectDetailPage'
import { SubjectsListPage } from './features/subjects-list/SubjectsListPage'
import { AnalyticsPage } from './features/analytics/AnalyticsPage'
import { MorePage } from './features/more/MorePage'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<RootGate />} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/app" element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="subjects" element={<SubjectsListPage />} />
              <Route path="subjects/:subjectId" element={<SubjectDetailPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="more" element={<MorePage />} />
            </Route>
            <Route path="*" element={<RootGate />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}
