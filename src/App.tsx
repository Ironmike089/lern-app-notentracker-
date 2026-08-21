import { HashRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from './components/ui/Toast'
import { ErrorBoundary } from './components/ErrorBoundary'
import { RootGate } from './app/RootGate'
import { OnboardingRoute } from './app/OnboardingRoute'
import { AppShell } from './features/app-shell/AppShell'

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <HashRouter>
          <Routes>
            <Route path="/" element={<RootGate />} />
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/app" element={<AppShell />} />
            <Route path="*" element={<RootGate />} />
          </Routes>
        </HashRouter>
      </ToastProvider>
    </ErrorBoundary>
  )
}
