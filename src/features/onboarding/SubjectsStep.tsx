import { useMemo, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { CUSTOM_SUBJECT_ICON, searchSubjectCatalog } from '../../domain/subjects'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { SearchInput } from '../../components/ui/SearchInput'
import { Button } from '../../components/ui/Button'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { cn } from '../../utils/cn'
import { createId } from '../../utils/id'
import type { SubjectSelectionDraft } from './types'

interface SubjectsStepProps {
  initialSelections: SubjectSelectionDraft[]
  submitting: boolean
  onFinish: (selections: SubjectSelectionDraft[]) => void
}

export function SubjectsStep({ initialSelections, submitting, onFinish }: SubjectsStepProps) {
  const [query, setQuery] = useState('')
  const [selections, setSelections] = useState<SubjectSelectionDraft[]>(initialSelections)
  const [customName, setCustomName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const results = useMemo(() => searchSubjectCatalog(query), [query])
  const selectedKeys = useMemo(() => new Set(selections.map((s) => s.key)), [selections])

  function toggleCatalogSubject(catalogId: string, name: string, icon: string) {
    setError(null)
    setSelections((prev) => {
      if (prev.some((s) => s.key === catalogId)) {
        return prev.filter((s) => s.key !== catalogId)
      }
      return [...prev, { key: catalogId, catalogId, name, icon, custom: false }]
    })
  }

  function removeSelection(key: string) {
    setSelections((prev) => prev.filter((s) => s.key !== key))
  }

  function addCustomSubject() {
    const name = customName.trim()
    if (!name) return
    const alreadyExists = selections.some((s) => s.name.toLowerCase() === name.toLowerCase())
    if (alreadyExists) {
      setError(`„${name}“ ist schon in deiner Auswahl.`)
      return
    }
    setError(null)
    setSelections((prev) => [
      ...prev,
      { key: createId(), name, icon: CUSTOM_SUBJECT_ICON, custom: true },
    ])
    setCustomName('')
  }

  function handleFinish() {
    if (selections.length === 0) {
      setError('Wähle mindestens ein Fach aus, um loszulegen.')
      return
    }
    onFinish(selections)
  }

  const customSelections = selections.filter((s) => s.custom)

  return (
    <div className="flex flex-1 flex-col gap-4 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">Welche Fächer hast du?</h2>
        <p className="text-sm text-ink-soft">Du kannst das später jederzeit anpassen.</p>
      </div>

      <SearchInput
        placeholder="Fach suchen…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Fach suchen"
      />

      {error && <ErrorBanner message={error} />}

      <div className="flex flex-wrap gap-2 overflow-y-auto pb-1">
        {results.map((subject) => {
          const selected = selectedKeys.has(subject.id)
          return (
            <button
              key={subject.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleCatalogSubject(subject.id, subject.name, subject.icon)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200',
                'active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
                selected
                  ? 'border-mint bg-mint-soft/40 text-ink'
                  : 'border-border bg-bg-card text-ink-soft hover:border-border-strong hover:text-ink',
              )}
            >
              <SubjectIcon iconKey={subject.icon} className="h-4 w-4" />
              {subject.name}
              {selected && <Check className="h-3.5 w-3.5 text-mint" strokeWidth={3} />}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Eigenes Fach hinzufügen
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCustomSubject()
              }
            }}
            placeholder="z. B. Astronomie"
            className="h-11 flex-1 rounded-control border border-border bg-bg-raised px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-mint"
          />
          <Button type="button" variant="secondary" onClick={addCustomSubject} aria-label="Fach hinzufügen">
            <Plus className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>

        {customSelections.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {customSelections.map((s) => (
              <span
                key={s.key}
                className="flex items-center gap-1.5 rounded-full border border-mint bg-mint-soft/40 px-3 py-1.5 text-sm text-ink"
              >
                {s.name}
                <button
                  type="button"
                  onClick={() => removeSelection(s.key)}
                  aria-label={`${s.name} entfernen`}
                  className="text-ink-soft transition-colors hover:text-ink"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 -mx-5 mt-auto border-t border-border bg-bg px-5 pt-4 pb-1">
        <Button size="lg" className="w-full" onClick={handleFinish} disabled={submitting}>
          {submitting ? 'Wird eingerichtet…' : `Fertig${selections.length > 0 ? ` (${selections.length})` : ''}`}
        </Button>
      </div>
    </div>
  )
}
