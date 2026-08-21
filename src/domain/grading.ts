import type { GradingScale } from './types'

/**
 * Pure grading calculations. No UI, no storage — safe to unit test in isolation.
 *
 * Two scales are supported:
 * - grade_1_6: German school grades, 1 = best, 6 = worst (SMALLER is better).
 * - points_0_15: Gymnasiale Oberstufe points, 0 = worst, 15 = best (BIGGER is better).
 */

export type PerformanceTier = 'excellent' | 'good' | 'mid' | 'warn' | 'bad'

/** 0 = 6, 15 = 1+, matches the official Punkte-zu-Note orientation table. */
const POINTS_TO_GRADE_LABEL: Record<number, string> = {
  15: '1+',
  14: '1',
  13: '1-',
  12: '2+',
  11: '2',
  10: '2-',
  9: '3+',
  8: '3',
  7: '3-',
  6: '4+',
  5: '4',
  4: '4-',
  3: '5+',
  2: '5',
  1: '5-',
  0: '6',
}

export function isHigherBetter(scale: GradingScale): boolean {
  return scale === 'points_0_15'
}

export function gradeValueBounds(scale: GradingScale): { min: number; max: number } {
  return scale === 'points_0_15' ? { min: 0, max: 15 } : { min: 1, max: 6 }
}

/** Maps a points value (0–15) to its approximate 1–6 grade band, for display and tiering. */
export function pointsToGradeBand(points: number): number {
  if (points >= 13) return 1
  if (points >= 10) return 2
  if (points >= 7) return 3
  if (points >= 4) return 4
  if (points >= 1) return 5
  return 6
}

/** Secondary display only, e.g. "11 P. ≈ Note 2" — never the primary value for points_0_15. */
export function pointsToGradeLabel(points: number): string {
  const rounded = Math.round(points)
  return POINTS_TO_GRADE_LABEL[Math.min(15, Math.max(0, rounded))] ?? '–'
}

export interface WeightedInput {
  value: number
  weight: number
}

/** Weighted average; falls back to a plain mean when all weights are zero. */
export function calculateWeightedAverage(entries: WeightedInput[]): number | null {
  if (entries.length === 0) return null
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  if (totalWeight <= 0) {
    return entries.reduce((sum, e) => sum + e.value, 0) / entries.length
  }
  return entries.reduce((sum, e) => sum + e.value * e.weight, 0) / totalWeight
}

/** Classifies a value into a performance tier, scale-aware (direction differs per scale). */
export function performanceTier(value: number, scale: GradingScale): PerformanceTier {
  const gradeLike = scale === 'points_0_15' ? pointsToGradeBand(value) : value
  if (gradeLike <= 1.5) return 'excellent'
  if (gradeLike <= 2.5) return 'good'
  if (gradeLike <= 3.5) return 'mid'
  if (gradeLike <= 4.5) return 'warn'
  return 'bad'
}

export function performanceColorVar(tier: PerformanceTier): string {
  return `var(--color-perf-${tier === 'excellent' ? 'excellent' : tier})`
}

/** Formats a number the German way, e.g. 1.75 -> "1,75". */
export function formatNumberDe(value: number, decimals: number): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Formats a value for display according to its grading scale. */
export function formatGradeValue(value: number, scale: GradingScale): string {
  if (scale === 'points_0_15') {
    const isWhole = Number.isInteger(value)
    return `${formatNumberDe(value, isWhole ? 0 : 1)} P.`
  }
  return formatNumberDe(value, 2)
}

/** How a new hypothetical entry would move the current average, in scale units. */
export function simulateNewEntry(
  currentEntries: WeightedInput[],
  newEntry: WeightedInput,
): { before: number | null; after: number | null; delta: number | null } {
  const before = calculateWeightedAverage(currentEntries)
  const after = calculateWeightedAverage([...currentEntries, newEntry])
  const delta = before !== null && after !== null ? after - before : null
  return { before, after, delta }
}
