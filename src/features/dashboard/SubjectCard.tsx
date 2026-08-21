import { useNavigate } from 'react-router-dom'
import type { GradeEntry } from '../../domain/types'
import type { SubjectStats } from '../../services/gradeStatsService'
import { formatGradeValue, type PerformanceTier } from '../../domain/grading'
import { getSubjectColorKey, subjectColorVar } from '../../domain/subjectColors'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { Card } from '../../components/ui/Card'
import { PerformanceBar } from '../../components/ui/PerformanceBar'
import { GradeBadge } from '../../components/ui/GradeBadge'
import { cn } from '../../utils/cn'

// Written out in full (not interpolated) so Tailwind's static scanner picks up every class.
const SCORE_BADGE_STYLES: Record<PerformanceTier, string> = {
  excellent: 'bg-perf-excellent/15 text-perf-excellent',
  good: 'bg-perf-good/15 text-perf-good',
  medium: 'bg-perf-medium/15 text-perf-medium',
  warning: 'bg-perf-warning/15 text-perf-warning',
  critical: 'bg-perf-critical/15 text-perf-critical',
}

function entryCount(stats: SubjectStats): number {
  return stats.categories.reduce((sum, c) => sum + c.entries.length, 0)
}

function mostRecentEntry(stats: SubjectStats): GradeEntry | null {
  const all = stats.categories.flatMap((c) => c.entries)
  if (all.length === 0) return null
  return all.reduce((latest, entry) => (entry.date > latest.date ? entry : latest))
}

/**
 * Two color systems, never mixed (see index.css): the icon chip, left edge
 * and background wash always use the subject's own identity color — a
 * Mathematik card stays blue whether the grade is a 1 or a 5. Only the
 * score badge and mini performance bar react to how good the grade is.
 */
export function SubjectCard({ stats }: { stats: SubjectStats }) {
  const navigate = useNavigate()
  const { subject, average, performanceScore: score, performanceTier: tier } = stats
  const hasValue = average.value !== null && average.scale !== null
  const count = entryCount(stats)
  const colorKey = getSubjectColorKey(subject)
  const colorVar = subjectColorVar(colorKey)
  const lastEntry = mostRecentEntry(stats)

  return (
    <Card
      interactive
      onClick={() => navigate(`/app/subjects/${subject.id}`)}
      className="relative overflow-hidden pl-5"
      style={{
        backgroundImage: `linear-gradient(120deg, color-mix(in oklab, ${colorVar} 6%, transparent) 0%, transparent 45%)`,
      }}
    >
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: colorVar }} aria-hidden="true" />

      <div className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `color-mix(in oklab, ${colorVar} 18%, transparent)`, color: colorVar }}
        >
          <SubjectIcon iconKey={subject.icon} className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-ink">{subject.name}</p>
            {hasValue ? (
              <span
                className={cn(
                  'shrink-0 rounded-control px-2 py-1 text-sm font-bold tabular-nums',
                  tier && SCORE_BADGE_STYLES[tier],
                )}
              >
                {formatGradeValue(average.value as number, average.scale!)}
              </span>
            ) : (
              <span className="shrink-0 text-xs text-ink-faint">Keine Noten</span>
            )}
          </div>

          <div className="mt-0.5 flex items-center gap-2">
            <p className="text-xs text-ink-faint">
              {count} {count === 1 ? 'Leistung' : 'Leistungen'}
            </p>
            {lastEntry && (
              <>
                <span className="text-ink-faint" aria-hidden="true">
                  ·
                </span>
                <span className="text-xs text-ink-faint">zuletzt</span>
                <GradeBadge value={lastEntry.value} scale={lastEntry.scale} label={String(lastEntry.value)} size="sm" />
              </>
            )}
          </div>

          {hasValue && score !== null && tier && (
            <PerformanceBar score={score} tier={tier} size="sm" className="mt-2.5" />
          )}
        </div>
      </div>
    </Card>
  )
}
