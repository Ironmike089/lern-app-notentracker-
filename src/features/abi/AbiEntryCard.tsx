import { ChevronRight, GraduationCap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/ui/Card'

/** The Dashboard's entry point into the Abi-specific area — kept out of the fixed 4-item bottom nav on purpose. */
export function AbiEntryCard() {
  const navigate = useNavigate()
  return (
    <Card interactive onClick={() => navigate('/app/abi')} className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">
        <GraduationCap className="h-4.5 w-4.5" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">Dein Abi-Bereich</p>
        <p className="text-xs text-ink-faint">Punkteschnitt, Prognose und Voraussetzungen</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} />
    </Card>
  )
}
