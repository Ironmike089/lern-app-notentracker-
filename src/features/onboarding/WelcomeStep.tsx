import { GraduationCap } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function WelcomeStep({ onNext }: { onNext: () => void }) {
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
      <Button size="lg" className="w-full" onClick={onNext}>
        Loslegen
      </Button>
    </div>
  )
}
