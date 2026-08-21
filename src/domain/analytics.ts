import {
  categoryAverage,
  isHigherBetter,
  performanceScore,
  subjectAverage,
  type AverageResult,
} from './grading'
import type { GradingScale } from './types'

/**
 * Trend, distribution, semester comparison and period-delta math. All pure
 * compositions of the existing engine exports (categoryAverage /
 * subjectAverage / performanceScore) — domain/grading.ts itself is untouched.
 */

// ---------------------------------------------------------------------------
// Trend: running subject average over time, weight-aware
// ---------------------------------------------------------------------------

export interface TrendEntryInput {
  categoryId: string
  categoryWeight: number
  value: number
  weight: number
  scale: GradingScale
  date: string
}

export interface TrendPoint {
  date: string
  average: number
  scale: GradingScale
  /** 0-100, higher always better — what the chart should actually plot. */
  score: number
}

/**
 * Replays entries in chronological order, recomputing the subject average
 * after each one using the real category weights — never a naive running
 * mean of raw values. A prefix that can't be honestly averaged (e.g. a
 * mid-history scale switch making it mixed) is simply skipped, not faked.
 */
export function computeSubjectTrend(entries: TrendEntryInput[]): TrendPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const byCategory = new Map<
    string,
    { weight: number; seen: { value: number; weight: number; scale: GradingScale }[] }
  >()
  const points: TrendPoint[] = []

  for (const entry of sorted) {
    let bucket = byCategory.get(entry.categoryId)
    if (!bucket) {
      bucket = { weight: entry.categoryWeight, seen: [] }
      byCategory.set(entry.categoryId, bucket)
    }
    bucket.seen.push({ value: entry.value, weight: entry.weight, scale: entry.scale })

    const categoryAverages = [...byCategory.values()].map((b) => ({
      average: categoryAverage(b.seen),
      weight: b.weight,
    }))
    const result = subjectAverage(categoryAverages)

    if (result.value !== null && result.scale !== null) {
      points.push({
        date: entry.date,
        average: result.value,
        scale: result.scale,
        score: performanceScore(result.value, result.scale),
      })
    }
  }

  return points
}

// ---------------------------------------------------------------------------
// Distribution
// ---------------------------------------------------------------------------

export interface DistributionBucket {
  label: string
  count: number
}

const POINTS_BANDS: { label: string; test: (v: number) => boolean }[] = [
  { label: '13–15', test: (v) => v >= 13 },
  { label: '10–12', test: (v) => v >= 10 && v <= 12 },
  { label: '7–9', test: (v) => v >= 7 && v <= 9 },
  { label: '4–6', test: (v) => v >= 4 && v <= 6 },
  { label: '1–3', test: (v) => v >= 1 && v <= 3 },
  { label: '0', test: (v) => v === 0 },
]

export function computeGradeDistribution(values: number[], scale: GradingScale): DistributionBucket[] {
  if (scale === 'points_0_15') {
    return POINTS_BANDS.map(({ label, test }) => ({ label, count: values.filter(test).length }))
  }
  return [1, 2, 3, 4, 5, 6].map((n) => ({ label: String(n), count: values.filter((v) => v === n).length }))
}

// ---------------------------------------------------------------------------
// Semester comparison
// ---------------------------------------------------------------------------

export interface SemesterAverageInput {
  semesterId: string
  label: string
  average: AverageResult
}

export interface SemesterComparison {
  fromLabel: string
  toLabel: string
  delta: number
  improved: boolean
}

export interface SemesterComparisonResult {
  /** Only semesters that actually have a computable average. */
  withData: SemesterAverageInput[]
  comparisons: SemesterComparison[]
}

/** Compares consecutive semesters (in the order given) that both have data on the same scale. */
export function compareSemesters(entries: SemesterAverageInput[]): SemesterComparisonResult {
  const withData = entries.filter(
    (e) => e.average.value !== null && e.average.scale !== null && !e.average.mixedScales,
  )

  const comparisons: SemesterComparison[] = []
  for (let i = 1; i < withData.length; i++) {
    const prev = withData[i - 1]
    const curr = withData[i]
    if (prev.average.scale !== curr.average.scale || curr.average.scale === null) continue
    const delta = (curr.average.value as number) - (prev.average.value as number)
    const improved = isHigherBetter(curr.average.scale) ? delta > 0 : delta < 0
    comparisons.push({ fromLabel: prev.label, toLabel: curr.label, delta, improved })
  }

  return { withData, comparisons }
}

// ---------------------------------------------------------------------------
// Performance delta over a period (e.g. "last 30 days")
// ---------------------------------------------------------------------------

export interface PeriodScoreDelta {
  /** Score-point change (0-100 scale), signed. */
  delta: number
  improved: boolean
}

/**
 * Compares the performance score right before `sinceDate` to the latest
 * score at/after it. Needs at least one point on each side — otherwise
 * there is nothing honest to compare, and the caller should show
 * "noch nicht genügend Daten" instead of a number.
 */
export function computeScoreDeltaSince(points: TrendPoint[], sinceDate: string): PeriodScoreDelta | null {
  const before = points.filter((p) => p.date < sinceDate)
  const during = points.filter((p) => p.date >= sinceDate)
  if (before.length === 0 || during.length === 0) return null

  const baseline = before[before.length - 1].score
  const latest = during[during.length - 1].score
  const delta = latest - baseline
  return { delta, improved: delta > 0 }
}
