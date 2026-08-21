import { performanceColorVar, type PerformanceTier } from '../../domain/grading'
import { cn } from '../../utils/cn'

const TIER_LABEL: Record<PerformanceTier, string> = {
  excellent: 'stark',
  good: 'gut',
  medium: 'mittel',
  warning: 'schwach',
  critical: 'kritisch',
}

interface PerformanceBarProps {
  score: number
  tier: PerformanceTier
  size?: 'sm' | 'lg'
  glow?: boolean
  /** Optional second, smaller marker (e.g. a Zielnote) at another position on the same 0-100 scale. */
  goalScore?: number
  className?: string
}

/**
 * The app's recurring red -> green performance gradient (System B, see
 * subjectColors.ts for the separate per-subject System A). Unlike a
 * progress bar, the full red-to-green scale is always visible — a small
 * chevron marks *where* the current score sits on it, rather than filling
 * up to that point. Color is never the only signal: the marker's position
 * and an sr-only label carry the same information.
 */
export function PerformanceBar({ score, tier, size = 'lg', glow = false, goalScore, className }: PerformanceBarProps) {
  const color = performanceColorVar(tier)
  const clamped = Math.min(100, Math.max(0, score))

  return (
    <div className={cn('space-y-2', className)}>
      {size === 'lg' && (
        <>
          <div className="flex justify-between text-[11px] font-medium uppercase tracking-wide text-ink-faint md:hidden">
            <span>Schwach</span>
            <span>Stark</span>
          </div>
          <div className="hidden justify-between text-[11px] font-medium uppercase tracking-wide text-ink-faint md:flex">
            <span>Kritisch</span>
            <span>Solide</span>
            <span>Gut</span>
            <span>Sehr stark</span>
          </div>
        </>
      )}

      <div className="relative pt-2.5">
        <div
          aria-hidden="true"
          className="absolute -translate-x-1/2 transition-[left] duration-[220ms] ease-out"
          style={{ left: `${clamped}%`, top: 0 }}
        >
          <div
            className="h-0 w-0 border-x-[6px] border-t-[8px] border-x-transparent"
            style={{
              borderTopColor: 'var(--color-ink)',
              filter: glow ? `drop-shadow(0 0 6px color-mix(in oklab, ${color} 75%, transparent))` : undefined,
            }}
          />
        </div>

        <div
          role="img"
          aria-label={`Leistung: ${TIER_LABEL[tier]}, ${Math.round(score)} von 100${goalScore !== undefined ? `, Ziel bei ${Math.round(goalScore)} von 100` : ''}`}
          className={cn(
            'relative w-full overflow-hidden rounded-full',
            size === 'lg' ? 'h-2.5' : 'h-1.5',
          )}
          style={{
            background:
              'linear-gradient(90deg, var(--color-perf-critical) 0%, var(--color-perf-warning) 25%, var(--color-perf-medium) 50%, var(--color-perf-good) 75%, var(--color-perf-excellent) 100%)',
          }}
        >
          {goalScore !== undefined && (
            <div
              aria-hidden="true"
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-white/70 bg-black/20 transition-[left] duration-[220ms] ease-out"
              style={{
                left: `${goalScore}%`,
                width: size === 'lg' ? '0.5rem' : '0.4rem',
                height: size === 'lg' ? '0.5rem' : '0.4rem',
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
