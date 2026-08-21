import { BarChart3 } from 'lucide-react'
import { isHigherBetter } from '../../domain/grading'
import type { SubjectStats } from '../../services/gradeStatsService'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'

export function StatistikTab({ stats }: { stats: SubjectStats }) {
  const allEntries = stats.categories.flatMap((c) => c.entries)

  if (allEntries.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-5 w-5" strokeWidth={1.75} />}
        title="Noch keine Statistik"
        description="Sobald du Noten einträgst, siehst du hier eine Übersicht."
      />
    )
  }

  const scale = stats.average.scale
  const values = allEntries.map((e) => e.value)
  const best = scale && isHigherBetter(scale) ? Math.max(...values) : Math.min(...values)
  const weak = scale && isHigherBetter(scale) ? Math.min(...values) : Math.max(...values)

  const enabledCategories = stats.categories.filter((c) => c.category.enabled)
  const weightSum = enabledCategories.reduce((sum, c) => sum + c.category.weight, 0)

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Card className="flex-1 space-y-1">
          <p className="text-xs font-medium text-ink-faint">Leistungen</p>
          <p className="text-2xl font-bold text-ink">{allEntries.length}</p>
        </Card>
        {scale && (
          <>
            <Card className="flex-1 space-y-1">
              <p className="text-xs font-medium text-ink-faint">Beste Einzelnote</p>
              <p className="text-2xl font-bold text-perf-excellent">{best}</p>
            </Card>
            <Card className="flex-1 space-y-1">
              <p className="text-xs font-medium text-ink-faint">Schwächste</p>
              <p className="text-2xl font-bold text-ink-soft">{weak}</p>
            </Card>
          </>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-soft">Gewichtung der Kategorien</p>
        <Card className="space-y-3">
          {enabledCategories.map((c) => {
            const percent = weightSum > 0 ? Math.round((c.category.weight / weightSum) * 100) : 0
            return (
              <div key={c.category.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-soft">{c.category.name}</span>
                  <span className="text-ink-faint">{percent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-raised">
                  <div
                    className="h-full rounded-full bg-mint transition-[width] duration-[220ms] ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}
