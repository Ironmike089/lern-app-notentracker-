import { useId } from 'react'
import { performanceColorVar, type PerformanceTier } from '../../domain/grading'
import { clampScore, gaugeNeedleAngle, gaugePointOnArc } from '../../domain/gauge'
import { cn } from '../../utils/cn'

const TIER_LABEL: Record<PerformanceTier, string> = {
  excellent: 'stark',
  good: 'gut',
  medium: 'mittel',
  warning: 'schwach',
  critical: 'kritisch',
}

const CX = 110
const CY = 112
const RADIUS = 88
const STROKE = 15
const NEEDLE_LENGTH = 74
const CENTER = { cx: CX, cy: CY }

function pointOnArc(angleDeg: number, radius: number): { x: number; y: number } {
  return gaugePointOnArc(angleDeg, radius, CENTER)
}

interface PerformanceGaugeProps {
  /** 0–100, already computed via performanceScore(). */
  score: number
  tier: PerformanceTier
  /** Big number in the center, e.g. "2,17" or "10,8 P." — formatting is the caller's job. */
  primaryValue: string
  primaryLabel: string
  className?: string
}

/**
 * A 180° semicircular performance gauge — the Dashboard's headline element.
 * One component serves both grading scales (grade_1_6 and points_0_15
 * alike): both are pre-normalized to the shared 0–100 performanceScore
 * before reaching this component, which only ever positions a needle along
 * a fixed red→green arc. A thin needle (not a dot-on-arc marker, to stay
 * visually distinct from PerformanceBar's chevron) pivots smoothly between
 * updates; the global prefers-reduced-motion rule in index.css already
 * collapses that transition to near-instant when requested.
 */
export function PerformanceGauge({ score, tier, primaryValue, primaryLabel, className }: PerformanceGaugeProps) {
  const gradientId = useId()
  const clamped = clampScore(score)
  const needleAngle = gaugeNeedleAngle(score)

  const start = pointOnArc(180, RADIUS)
  const end = pointOnArc(0, RADIUS)
  const needleTip = pointOnArc(needleAngle, NEEDLE_LENGTH)

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative w-full max-w-[280px]">
        <svg viewBox="0 0 220 128" className="w-full" role="img" aria-label={`Gesamtleistung: ${TIER_LABEL[tier]}, ${Math.round(clamped)} von 100`}>
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-perf-critical)" />
              <stop offset="25%" stopColor="var(--color-perf-warning)" />
              <stop offset="50%" stopColor="var(--color-perf-medium)" />
              <stop offset="75%" stopColor="var(--color-perf-good)" />
              <stop offset="100%" stopColor="var(--color-perf-excellent)" />
            </linearGradient>
          </defs>

          <path
            d={`M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 0 1 ${end.x} ${end.y}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />

          <g className="transition-transform duration-300 ease-out" style={{ transformOrigin: `${CX}px ${CY}px` }}>
            <line
              x1={CX}
              y1={CY}
              x2={needleTip.x}
              y2={needleTip.y}
              stroke="var(--color-ink)"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <circle cx={CX} cy={CY} r={6} fill="var(--color-ink)" />
            <circle cx={CX} cy={CY} r={2.5} fill={performanceColorVar(tier)} />
          </g>
        </svg>

        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
          <p className="text-4xl font-extrabold tracking-tight text-ink tabular-nums">{primaryValue}</p>
          <p className="text-xs font-medium text-ink-faint">{primaryLabel}</p>
        </div>
      </div>

      <div className="mt-1 flex w-full max-w-[280px] justify-between px-1 text-[11px] font-medium uppercase tracking-wide text-ink-faint">
        <span>Schwach</span>
        <span>Stark</span>
      </div>
    </div>
  )
}
