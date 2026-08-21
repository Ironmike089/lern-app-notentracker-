import { TrendingDown, TrendingUp } from 'lucide-react'
import type { SchoolProfile } from '../../domain/types'
import { formatGradeValue, formatNumberDe, performanceScore, performanceTierFromScore } from '../../domain/grading'
import type { OverallStats, OverallTrend } from '../../services/gradeStatsService'
import { PerformanceBar } from '../../components/ui/PerformanceBar'
import { WarningBanner } from '../../components/ui/WarningBanner'
import { useCountUp } from '../../utils/useCountUp'
import { timeBasedGreeting } from '../../utils/greeting'
import { cn } from '../../utils/cn'

const MIXED_SCALE_WARNING =
  'Das Bewertungssystem hat sich geändert. Bereits gespeicherte Leistungen werden nicht automatisch umgerechnet.'

function scaleLabel(profile: SchoolProfile): string {
  return profile.gradingScale === 'points_0_15' ? 'Punkte (0–15)' : 'Noten (1–6)'
}

function formatDelta(delta: number, scale: SchoolProfile['gradingScale']): string {
  const decimals = scale === 'points_0_15' ? 1 : 2
  return formatNumberDe(Math.abs(delta), decimals)
}

interface DashboardHeroProps {
  profile: SchoolProfile
  stats: OverallStats
  trend: OverallTrend | null
  activeSubjectsCount: number
  totalEntries: number
}

export function DashboardHero({ profile, stats, trend, activeSubjectsCount, totalEntries }: DashboardHeroProps) {
  const { average } = stats
  const hasValue = average.value !== null && average.scale !== null
  const displayValue = useCountUp(average.value)

  const score = hasValue ? performanceScore(displayValue as number, average.scale!) : null
  const tier = score !== null ? performanceTierFromScore(score) : null

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-card border border-border p-5"
        style={{ backgroundImage: 'var(--gradient-hero)', backgroundColor: 'var(--color-bg-card)' }}
      >
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm text-ink-soft">{timeBasedGreeting()}</p>
            <p className="text-sm font-medium text-ink-soft">Dein aktueller Schnitt</p>
          </div>
          <span className="shrink-0 rounded-pill bg-bg-raised/80 px-2.5 py-1 text-xs font-medium text-ink-soft backdrop-blur">
            {scaleLabel(profile)}
          </span>
        </div>

        <div className="relative mt-3 flex items-end gap-3">
          <p className="text-6xl font-extrabold tracking-tight text-ink tabular-nums">
            {hasValue ? formatGradeValue(displayValue as number, average.scale!) : '–'}
          </p>
          {trend && (
            <span
              className={cn(
                'mb-2 flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold',
                trend.improved ? 'bg-perf-excellent/15 text-perf-excellent' : 'bg-perf-warning/15 text-perf-warning',
              )}
            >
              {trend.improved ? (
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
              {formatDelta(trend.delta, profile.gradingScale)} {trend.improved ? 'besser' : 'schwächer'}
            </span>
          )}
        </div>

        {hasValue && score !== null && tier !== null ? (
          <PerformanceBar score={score} tier={tier} glow className="relative mt-5" />
        ) : (
          <p className="relative mt-5 text-sm text-ink-faint">Noch keine Noten erfasst</p>
        )}

        <p className="relative mt-4 text-xs text-ink-faint">
          {activeSubjectsCount} aktive {activeSubjectsCount === 1 ? 'Fach' : 'Fächer'} · {totalEntries}{' '}
          {totalEntries === 1 ? 'Leistung' : 'Leistungen'}
        </p>
      </div>

      {stats.mixedScaleWarning && <WarningBanner message={MIXED_SCALE_WARNING} />}
    </div>
  )
}
