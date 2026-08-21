import { performanceColorVar, type PerformanceTier } from '../../domain/grading'
import { cn } from '../../utils/cn'

interface PerformanceBarProps {
  score: number
  tier: PerformanceTier
  size?: 'sm' | 'lg'
  className?: string
}

/** Horizontal "Kritisch -> Stark" indicator with a marker at the current performance score (0-100). */
export function PerformanceBar({ score, tier, size = 'lg', className }: PerformanceBarProps) {
  const color = performanceColorVar(tier)

  return (
    <div className={cn('space-y-1.5', className)}>
      {size === 'lg' && (
        <div className="flex justify-between text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          <span>Kritisch</span>
          <span>Stark</span>
        </div>
      )}
      <div className={cn('relative w-full rounded-full bg-bg-raised', size === 'lg' ? 'h-2' : 'h-1.5')}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-[220ms] ease-out"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-bg-card shadow transition-[left] duration-[220ms] ease-out"
          style={{
            left: `${score}%`,
            backgroundColor: color,
            width: size === 'lg' ? '0.9rem' : '0.65rem',
            height: size === 'lg' ? '0.9rem' : '0.65rem',
          }}
        />
      </div>
    </div>
  )
}
