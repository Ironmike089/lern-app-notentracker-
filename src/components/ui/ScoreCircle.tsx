import type { GradingScale } from '../../domain/types'
import { formatNumberDe, performanceColorVar, performanceTierFromScore } from '../../domain/grading'
import { cn } from '../../utils/cn'

const SIZE_STYLES = {
  sm: 'h-9 w-9 text-xs',
  md: 'h-11 w-11 text-sm',
}

interface ScoreCircleProps {
  /** 0–100, already computed via performanceScore() — this component never re-derives it. */
  score: number
  /** The raw value shown inside the circle (grade or points), formatted per scale. */
  value: number
  scale: GradingScale
  size?: 'sm' | 'md'
  /** Suppresses the trailing "P." unit label — for tight rows of several circles side by side. */
  hideUnit?: boolean
  className?: string
}

/**
 * The compact circular score indicator used throughout the app (subject
 * rows, Abi block summaries): white bold number on a performance-tier
 * background. Deliberately small (36–44px) — a quick indicator, not a hero
 * element. Always driven by the shared performanceScore()/tier lookup, so
 * this never becomes a second, diverging color system.
 */
export function ScoreCircle({ score, value, scale, size = 'md', hideUnit = false, className }: ScoreCircleProps) {
  const tier = performanceTierFromScore(score)
  const isPoints = scale === 'points_0_15'
  const label = isPoints ? formatNumberDe(value, Number.isInteger(value) ? 0 : 1) : formatNumberDe(value, 2)

  return (
    <span className={cn('inline-flex items-center gap-1', className)}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums text-white',
          SIZE_STYLES[size],
        )}
        style={{ backgroundColor: performanceColorVar(tier) }}
      >
        {label}
      </span>
      {isPoints && !hideUnit && <span className="text-[10px] font-medium text-ink-faint">P.</span>}
    </span>
  )
}
