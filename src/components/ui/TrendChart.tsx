import { useMemo, useState } from 'react'
import { formatDateDe, formatGradeValue } from '../../domain/grading'
import type { TrendPoint } from '../../domain/analytics'

interface TrendChartProps {
  points: TrendPoint[]
}

const WIDTH = 320
const HEIGHT = 140
const PADDING = 16

/**
 * Always plots the scale-independent performance score (higher = better),
 * never the raw grade — so an improvement never visually reads as a crash
 * just because grade_1_6 counts down. The actual grade shows in the caption
 * below the chart instead.
 */
export function TrendChart({ points }: TrendChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const { path, coords } = useMemo(() => {
    if (points.length === 0) return { path: '', coords: [] as { x: number; y: number }[] }
    const usableWidth = WIDTH - PADDING * 2
    const usableHeight = HEIGHT - PADDING * 2
    const step = points.length > 1 ? usableWidth / (points.length - 1) : 0
    const nextCoords = points.map((p, i) => ({
      x: PADDING + step * i,
      y: PADDING + usableHeight * (1 - p.score / 100),
    }))
    const nextPath = nextCoords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ')
    return { path: nextPath, coords: nextCoords }
  }, [points])

  if (points.length === 0) return null

  const selected = points[selectedIndex ?? points.length - 1]

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Notenverlauf über die Zeit">
        <line
          x1={PADDING}
          y1={HEIGHT / 2}
          x2={WIDTH - PADDING}
          y2={HEIGHT / 2}
          stroke="var(--color-border)"
          strokeDasharray="4 4"
        />
        <path d={path} fill="none" stroke="var(--color-mint)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle
            key={points[i].date + i}
            cx={c.x}
            cy={c.y}
            r={i === selectedIndex ? 5 : 3}
            fill={i === selectedIndex ? 'var(--color-mint)' : 'var(--color-bg-card)'}
            stroke="var(--color-mint)"
            strokeWidth={2}
            className="cursor-pointer transition-[r] duration-150"
            onClick={() => setSelectedIndex(i)}
          />
        ))}
      </svg>
      <p className="text-center text-sm text-ink-soft">
        {formatDateDe(selected.date)}
        {' · '}
        <span className="font-semibold text-ink">{formatGradeValue(selected.average, selected.scale)}</span>
      </p>
    </div>
  )
}
