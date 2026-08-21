import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, GraduationCap } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { seedDemoData } from '../../services/demoDataService'

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  const navigate = useNavigate()
  const [seedingDemo, setSeedingDemo] = useState(false)
  const [demoError, setDemoError] = useState<string | null>(null)

  async function handleViewDemo() {
    setSeedingDemo(true)
    setDemoError(null)
    try {
      await seedDemoData()
      navigate('/app', { replace: true })
    } catch (err) {
      setDemoError(err instanceof Error ? err.message : 'Demo-Daten konnten nicht angelegt werden.')
      setSeedingDemo(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10 text-center animate-fade-in">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mint-soft text-mint">
        <GraduationCap className="h-8 w-8" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-balance text-ink">
          Deine Noten. Sofort im Blick.
        </h1>
        <p className="text-base text-ink-soft">Richte deinen Tracker in weniger als einer Minute ein.</p>
      </div>

      {demoError && (
        <div className="w-full">
          <ErrorBanner message={demoError} />
        </div>
      )}

      <div className="flex w-full flex-col gap-2">
        <Button size="lg" className="w-full" onClick={onNext} disabled={seedingDemo}>
          Loslegen
        </Button>
        {import.meta.env.DEV && (
          <Button variant="ghost" size="lg" className="w-full" onClick={handleViewDemo} disabled={seedingDemo}>
            <FlaskConical className="h-4 w-4" strokeWidth={2} />
            {seedingDemo ? 'Demo wird geladen…' : 'Demo ansehen'}
          </Button>
        )}
      </div>
    </div>
  )
}
