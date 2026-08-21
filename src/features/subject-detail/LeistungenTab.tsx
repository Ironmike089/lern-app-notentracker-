import { Plus } from 'lucide-react'
import type { GradeEntry, Subject } from '../../domain/types'
import { formatGradeValue, formatPercent } from '../../domain/grading'
import type { SubjectStats } from '../../services/gradeStatsService'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useQuickAdd } from '../grades/quickAdd'

interface LeistungenTabProps {
  subject: Subject
  stats: SubjectStats
  onEditEntry: (entry: GradeEntry) => void
}

export function LeistungenTab({ subject, stats, onEditEntry }: LeistungenTabProps) {
  const { openQuickAdd } = useQuickAdd()

  if (stats.categories.length === 0) {
    return (
      <EmptyState
        icon={<Plus className="h-5 w-5" strokeWidth={1.75} />}
        title="Noch keine Kategorien"
        description="Für dieses Fach wurden noch keine Bewertungskategorien angelegt."
      />
    )
  }

  const totalEntries = stats.categories.reduce((sum, c) => sum + c.entries.length, 0)
  if (totalEntries === 0) {
    return (
      <EmptyState
        icon={<Plus className="h-5 w-5" strokeWidth={1.75} />}
        title={`Noch keine Leistungen in ${subject.name}.`}
        description="Trag die erste Note ein, um deinen Schnitt zu sehen."
        action={
          <Button size="md" onClick={() => openQuickAdd({ subjectId: subject.id })}>
            Erste Note eintragen
          </Button>
        }
      />
    )
  }

  const enabledWeightSum = stats.categories
    .filter((c) => c.category.enabled)
    .reduce((sum, c) => sum + c.category.weight, 0)

  return (
    <div className="space-y-3">
      {stats.categories.map((categoryStats) => {
        const percent =
          categoryStats.category.enabled && enabledWeightSum > 0
            ? Math.round((categoryStats.category.weight / enabledWeightSum) * 100)
            : null

        return (
          <Card
            key={categoryStats.category.id}
            className={!categoryStats.category.enabled ? 'opacity-60' : undefined}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                {categoryStats.category.name}
                {!categoryStats.category.enabled && (
                  <span className="ml-2 rounded-full bg-bg-raised px-2 py-0.5 text-[10px] font-medium normal-case text-ink-faint">
                    Deaktiviert
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-faint">
                {categoryStats.average.value !== null && categoryStats.average.scale !== null && (
                  <>Ø {formatGradeValue(categoryStats.average.value, categoryStats.average.scale)} · </>
                )}
                {percent !== null ? `Gewichtung ${formatPercent(percent)}` : `Gewichtung ${categoryStats.category.weight}x`}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {categoryStats.entries.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onEditEntry(entry)}
                  className="flex h-9 min-w-9 items-center justify-center rounded-control border border-border bg-bg-raised px-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:border-border-strong active:scale-95 animate-rise-in"
                >
                  {entry.value}
                </button>
              ))}
              <button
                type="button"
                onClick={() => openQuickAdd({ subjectId: subject.id, categoryId: categoryStats.category.id })}
                aria-label={`Note zu ${categoryStats.category.name} hinzufügen`}
                className="flex h-9 w-9 items-center justify-center rounded-control border border-dashed border-border-strong text-ink-soft transition-all duration-200 hover:border-mint hover:text-mint active:scale-95"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
