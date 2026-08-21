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
 * Horizontal "kritisch -> stark" indicator with a marker at the current
 * performance score (0-100). Color is never the only signal — the marker's
 * position and an sr-only label carry the same information as the color.
 */
export function PerformanceBar({ score, tier, size = 'lg', glow = false, goalScore, className }: PerformanceBarProps) {
  const color = performanceColorVar(tier)

  return (
    <div className={cn('space-y-1.5', className)}>
      {size === 'lg' && (
        <div className="flex justify-between text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          <span>Kritisch</span>
          <span>Stark</span>
        </div>
      )}
      <div
        className={cn('relative w-full rounded-full bg-bg-raised', size === 'lg' ? 'h-2' : 'h-1.5')}
        role="img"
        aria-label={`Leistung: ${TIER_LABEL[tier]}, ${Math.round(score)} von 100${goalScore !== undefined ? `, Ziel bei ${Math.round(goalScore)} von 100` : ''}`}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-[220ms] ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
        {goalScore !== undefined && (
          <div
            aria-hidden="true"
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-ink-soft bg-bg-card transition-[left] duration-[220ms] ease-out"
            style={{
              left: `${goalScore}%`,
              width: size === 'lg' ? '0.55rem' : '0.45rem',
              height: size === 'lg' ? '0.55rem' : '0.45rem',
            }}
          />
        )}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-card transition-[left] duration-[220ms] ease-out"
          style={{
            left: `${score}%`,
            backgroundColor: color,
            width: size === 'lg' ? '0.9rem' : '0.65rem',
            height: size === 'lg' ? '0.9rem' : '0.65rem',
            boxShadow: glow
              ? `0 0 20px -4px color-mix(in oklab, ${color} 70%, transparent)`
              : '0 1px 2px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  )
}
