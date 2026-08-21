import type { ButtonHTMLAttributes } from 'react'
import type { GradingScale } from '../../domain/types'
import { formatGradeValue, performanceTier, type PerformanceTier } from '../../domain/grading'
import { cn } from '../../utils/cn'

// Written out in full (not interpolated) so Tailwind's static scanner picks up every class.
const TIER_STYLES: Record<PerformanceTier, string> = {
  excellent: 'bg-perf-excellent/15 text-perf-excellent',
  good: 'bg-perf-good/15 text-perf-good',
  medium: 'bg-perf-medium/15 text-perf-medium',
  warning: 'bg-perf-warning/15 text-perf-warning',
  critical: 'bg-perf-critical/15 text-perf-critical',
}

const SIZE_STYLES = {
  sm: 'h-7 min-w-7 px-1.5 text-xs',
  md: 'h-9 min-w-9 px-2.5 text-sm',
}

interface GradeBadgeProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  value: number
  scale: GradingScale
  size?: 'sm' | 'md'
  /** Overrides the displayed text (color/tier still come from value+scale) — e.g. a compact "2" instead of "2,00" in a dense entry list. */
  label?: string
}

/**
 * A single grade, color-coded by how good it is (System B — see
 * subjectColors.ts for the separate System A). Renders as a plain <span>
 * when no onClick is given, a <button> otherwise — same visual either way.
 */
export function GradeBadge({ value, scale, size = 'md', label: labelOverride, className, onClick, ...props }: GradeBadgeProps) {
  const tier = performanceTier(value, scale)
  const classes = cn(
    'inline-flex items-center justify-center rounded-control font-semibold tabular-nums transition-transform duration-150',
    TIER_STYLES[tier],
    SIZE_STYLES[size],
    onClick && 'active:scale-95',
    className,
  )
  const label = labelOverride ?? formatGradeValue(value, scale)

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} {...props}>
        {label}
      </button>
    )
  }
  return <span className={classes}>{label}</span>
}
