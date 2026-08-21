import { useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { GERMAN_STATES } from '../../domain/germanStates'
import type { StateCode } from '../../domain/types'
import { SearchInput } from '../../components/ui/SearchInput'
import { SelectableCard } from '../../components/ui/SelectableCard'
import { EmptyState } from '../../components/ui/EmptyState'

interface StateStepProps {
  value?: StateCode
  onNext: (state: StateCode) => void
}

export function StateStep({ value, onNext }: StateStepProps) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GERMAN_STATES
    return GERMAN_STATES.filter((s) => s.name.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="flex flex-1 flex-col gap-5 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">In welchem Bundesland gehst du zur Schule?</h2>
        <p className="text-sm text-ink-soft">Wir passen die Bewertungslogik daran an.</p>
      </div>

      <SearchInput
        placeholder="Bundesland suchen…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Bundesland suchen"
      />

      <div className="flex flex-col gap-2 overflow-y-auto">
        {results.length === 0 ? (
          <EmptyState
            icon={<MapPin className="h-5 w-5" strokeWidth={1.75} />}
            title="Kein Bundesland gefunden"
            description="Versuch einen anderen Suchbegriff."
          />
        ) : (
          results.map((s) => (
            <SelectableCard
              key={s.code}
              selected={value === s.code}
              title={s.name}
              onClick={() => onNext(s.code)}
            />
          ))
        )}
      </div>
    </div>
  )
}
