import { Info } from 'lucide-react'
import { hasVerifiedAbiRules } from '../../domain/abiturRules'
import type { StateCode } from '../../domain/types'
import { Card } from '../../components/ui/Card'

/**
 * Gate for any future official Abitur calculation: only a state with a
 * verified AbiRuleConfig may claim to compute an official Abitur grade.
 * Until then this stays an explicit, honest "Punktetracker" notice.
 */
export function UpperSecondaryNotice({ state }: { state: StateCode }) {
  const verified = hasVerifiedAbiRules(state)

  return (
    <Card className="flex items-start gap-2.5">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet" strokeWidth={2} />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-ink">Oberstufen-Punktetracker</p>
        <p className="text-sm text-ink-soft">
          {verified
            ? 'Für dein Bundesland sind Abiturregeln hinterlegt.'
            : 'Diese App zeigt deine Punkte und Durchschnitte, berechnet aber keine offizielle Abiturnote — die Regeln dafür unterscheiden sich je Bundesland und wurden für dein Bundesland noch nicht verifiziert.'}
        </p>
      </div>
    </Card>
  )
}
