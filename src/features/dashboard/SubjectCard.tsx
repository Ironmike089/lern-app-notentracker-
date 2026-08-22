import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { SubjectStats } from '../../services/gradeStatsService'
import { getSubjectColorKey, subjectColorVar } from '../../domain/subjectColors'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { Card } from '../../components/ui/Card'
import { ScoreCircle } from '../../components/ui/ScoreCircle'

function entryCount(stats: SubjectStats): number {
  return stats.categories.reduce((sum, c) => sum + c.entries.length, 0)
}

/**
 * A single row in the always-vertical subject list (never a 2-column grid,
 * on any breakpoint — see Dashboard.tsx). Two color systems, never mixed
 * (see index.css): the icon chip and left edge always use the subject's own
 * identity color; only the ScoreCircle on the right reacts to grade quality.
 */
export function SubjectCard({ stats }: { stats: SubjectStats }) {
  const navigate = useNavigate()
  const { subject, average, performanceScore: score } = stats
  const hasValue = average.value !== null && average.scale !== null
  const count = entryCount(stats)
  const colorKey = getSubjectColorKey(subject)
  const colorVar = subjectColorVar(colorKey)

  return (
    <Card
      interactive
      onClick={() => navigate(`/app/subjects/${subject.id}`)}
      className="flex items-center gap-3 py-3 pl-4"
    >
      <span className="h-8 w-0.5 shrink-0 rounded-full" style={{ backgroundColor: colorVar }} aria-hidden="true" />

      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `color-mix(in oklab, ${colorVar} 18%, transparent)`, color: colorVar }}
      >
        <SubjectIcon iconKey={subject.icon} className="h-4.5 w-4.5" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{subject.name}</p>
        <p className="mt-0.5 truncate text-xs text-ink-faint">
          {count} {count === 1 ? 'Leistung' : 'Leistungen'}
        </p>
      </div>

      {hasValue && score !== null ? (
        <ScoreCircle score={score} value={average.value as number} scale={average.scale!} size="sm" />
      ) : (
        <span className="shrink-0 text-xs text-ink-faint">–</span>
      )}

      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} aria-hidden="true" />
    </Card>
  )
}
