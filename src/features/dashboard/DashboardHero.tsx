import type { ReactNode } from 'react'
import { BookOpen, ListChecks, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import type { SchoolProfile } from '../../domain/types'
import {
  formatGradeValue,
  formatNumberDe,
  performanceScore,
  performanceTierFromScore,
  pointsToGradeLabel,
} from '../../domain/grading'
import { computeOverallStatus, type PeriodImprovement } from '../../domain/analytics'
import type { OverallStats, OverallTrend } from '../../services/gradeStatsService'
import { PerformanceGauge } from '../../components/ui/PerformanceGauge'
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

interface StatTileProps {
  icon: ReactNode
  label: string
  value: string
  tone?: 'up' | 'down' | 'neutral'
}

function StatTile({ icon, label, value, tone = 'neutral' }: StatTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-control bg-bg-raised/70 p-2.5 backdrop-blur">
      <div className="flex items-center gap-1.5 text-ink-faint">
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p
        className={cn(
          'text-sm font-semibold tabular-nums',
          tone === 'up' && 'text-perf-excellent',
          tone === 'down' && 'text-perf-warning',
          tone === 'neutral' && 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  )
}

const STATUS_ICON: Record<ReturnType<typeof computeOverallStatus>['kind'], ReactNode> = {
  strong: <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />,
  improving: <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />,
  declining: <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />,
  stable: <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />,
  'insufficient-data': <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />,
}

export interface AbiPrognoseSummary {
  totalPoints: number
  maxPoints: number
}

interface DashboardHeroProps {
  profile: SchoolProfile
  stats: OverallStats
  trend: OverallTrend | null
  improvement: PeriodImprovement | null
  activeSubjectsCount: number
  totalEntries: number
  /** Only passed once an Abi-Modul is set up for a verified state — see Dashboard.tsx. */
  abiPrognose?: AbiPrognoseSummary | null
}

export function DashboardHero({
  profile,
  stats,
  trend,
  improvement,
  activeSubjectsCount,
  totalEntries,
  abiPrognose,
}: DashboardHeroProps) {
  const { average } = stats
  const hasValue = average.value !== null && average.scale !== null
  const displayValue = useCountUp(average.value)

  const score = hasValue ? performanceScore(displayValue as number, average.scale!) : null
  const tier = score !== null ? performanceTierFromScore(score) : null
  // Status uses the settled value, not the animating count-up display, so the text never flickers mid-animation.
  const finalTier = hasValue ? performanceTierFromScore(performanceScore(average.value as number, average.scale!)) : null
  const status = computeOverallStatus(finalTier, improvement)

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-card border border-border p-5"
        style={{ backgroundImage: 'var(--gradient-hero)', backgroundColor: 'var(--color-bg-card)' }}
      >
        <div className="relative flex items-start justify-between">
          <div>
            <p className="text-sm text-ink-soft">{timeBasedGreeting()}</p>
          </div>
          <div className="flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  'flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold',
                  trend.improved ? 'bg-perf-excellent/15 text-perf-excellent' : 'bg-perf-warning/15 text-perf-warning',
                )}
              >
                {trend.improved ? (
                  <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
                {formatDelta(trend.delta, profile.gradingScale)}
              </span>
            )}
            <span className="shrink-0 rounded-pill bg-bg-raised/80 px-2.5 py-1 text-xs font-medium text-ink-soft backdrop-blur">
              {scaleLabel(profile)}
            </span>
          </div>
        </div>

        {hasValue && score !== null && tier !== null ? (
          <>
            <PerformanceGauge
              score={score}
              tier={tier}
              primaryValue={formatGradeValue(displayValue as number, average.scale!)}
              primaryLabel="Gesamtdurchschnitt"
              className="relative mt-2"
            />
            <p
              className={cn(
                'relative mt-2 flex items-center justify-center gap-1 text-xs font-medium',
                status.kind === 'strong' || status.kind === 'improving'
                  ? 'text-perf-excellent'
                  : status.kind === 'declining'
                    ? 'text-perf-warning'
                    : 'text-ink-faint',
              )}
            >
              {STATUS_ICON[status.kind]}
              {status.text}
            </p>
            {abiPrognose && (
              <p className="relative mt-1 text-center text-xs font-medium text-violet">
                Abi-Prognose: {abiPrognose.totalPoints} / {abiPrognose.maxPoints} P.
              </p>
            )}
          </>
        ) : (
          <p className="relative mt-5 text-center text-sm text-ink-faint">Noch keine Noten erfasst</p>
        )}

        <div className="relative mt-4 grid grid-cols-4 gap-1.5 sm:gap-2">
          <StatTile icon={<BookOpen className="h-3.5 w-3.5" strokeWidth={2} />} label="Fächer" value={String(activeSubjectsCount)} />
          <StatTile icon={<ListChecks className="h-3.5 w-3.5" strokeWidth={2} />} label="Leistungen" value={String(totalEntries)} />
          <StatTile
            icon={<TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />}
            label="Ø-Score"
            value={score !== null ? `${Math.round(score)}` : '–'}
          />
          <StatTile
            icon={
              improvement === null ? (
                <Minus className="h-3.5 w-3.5" strokeWidth={2} />
              ) : improvement.improved ? (
                <TrendingUp className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" strokeWidth={2} />
              )
            }
            label="30 Tage"
            value={improvement !== null ? formatDelta(improvement.gradeDelta, improvement.scale) : '–'}
            tone={improvement === null ? 'neutral' : improvement.improved ? 'up' : 'down'}
          />
        </div>

        {hasValue && average.scale === 'points_0_15' && (
          <p className="relative mt-3 text-xs text-ink-faint">≈ Note {pointsToGradeLabel(average.value as number)}</p>
        )}
      </div>

      {stats.mixedScaleWarning && <WarningBanner message={MIXED_SCALE_WARNING} />}
    </div>
  )
}
