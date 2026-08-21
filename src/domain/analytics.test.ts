import { describe, expect, it } from 'vitest'
import {
  compareSemesters,
  computeGradeDistribution,
  computeScoreDeltaSince,
  computeSubjectTrend,
  type SemesterAverageInput,
  type TrendEntryInput,
} from './analytics'
import type { AverageResult } from './grading'

function entry(overrides: Partial<TrendEntryInput>): TrendEntryInput {
  return {
    categoryId: 'c1',
    categoryWeight: 1,
    value: 2,
    weight: 1,
    scale: 'grade_1_6',
    date: '2026-01-01',
    ...overrides,
  }
}

describe('computeSubjectTrend', () => {
  it('returns nothing for no entries', () => {
    expect(computeSubjectTrend([])).toEqual([])
  })

  it('produces one point per entry, in date order, with score derived from the running average', () => {
    const points = computeSubjectTrend([
      entry({ date: '2026-01-10', value: 2 }),
      entry({ date: '2026-01-01', value: 4 }),
    ])
    expect(points).toHaveLength(2)
    expect(points[0].date).toBe('2026-01-01')
    expect(points[0].average).toBe(4)
    expect(points[1].date).toBe('2026-01-10')
    expect(points[1].average).toBe(3) // (4 + 2) / 2
    expect(points[1].score).toBeCloseTo(((6 - 3) / 5) * 100)
  })

  it('respects category weights when combining multiple categories', () => {
    const points = computeSubjectTrend([
      entry({ categoryId: 'a', categoryWeight: 2, value: 2, date: '2026-01-01' }),
      entry({ categoryId: 'b', categoryWeight: 1, value: 5, date: '2026-01-02' }),
    ])
    // After both entries: subjectAverage = (2*2 + 5*1) / (2+1) = 3
    expect(points[1].average).toBeCloseTo(3)
  })

  it('scores points_0_15 entries with higher values as better', () => {
    const points = computeSubjectTrend([entry({ scale: 'points_0_15', value: 12, date: '2026-01-01' })])
    expect(points[0].score).toBeCloseTo((12 / 15) * 100)
  })
})

describe('computeGradeDistribution', () => {
  it('buckets grade_1_6 values by exact grade', () => {
    const buckets = computeGradeDistribution([1, 1, 2, 3, 3, 3, 6], 'grade_1_6')
    expect(buckets).toEqual([
      { label: '1', count: 2 },
      { label: '2', count: 1 },
      { label: '3', count: 3 },
      { label: '4', count: 0 },
      { label: '5', count: 0 },
      { label: '6', count: 1 },
    ])
  })

  it('buckets points_0_15 into the standard bands, including boundaries', () => {
    const buckets = computeGradeDistribution([15, 13, 12, 9, 6, 3, 0], 'points_0_15')
    expect(buckets).toEqual([
      { label: '13–15', count: 2 },
      { label: '10–12', count: 1 },
      { label: '7–9', count: 1 },
      { label: '4–6', count: 1 },
      { label: '1–3', count: 1 },
      { label: '0', count: 1 },
    ])
  })

  it('returns all-zero buckets for no values, never NaN', () => {
    const buckets = computeGradeDistribution([], 'grade_1_6')
    expect(buckets.every((b) => b.count === 0)).toBe(true)
  })
})

function semesterAvg(label: string, value: number | null, scale: AverageResult['scale'] = 'grade_1_6'): SemesterAverageInput {
  return { semesterId: label, label, average: { value, scale: value === null ? null : scale, mixedScales: false } }
}

describe('compareSemesters', () => {
  it('flags a lower grade_1_6 average as an improvement', () => {
    const result = compareSemesters([semesterAvg('1. HJ', 2.34), semesterAvg('2. HJ', 2.08)])
    expect(result.comparisons).toHaveLength(1)
    expect(result.comparisons[0].delta).toBeCloseTo(-0.26)
    expect(result.comparisons[0].improved).toBe(true)
  })

  it('flags a higher points_0_15 average as an improvement', () => {
    const result = compareSemesters([semesterAvg('Q1', 8, 'points_0_15'), semesterAvg('Q2', 11, 'points_0_15')])
    expect(result.comparisons[0].improved).toBe(true)
    expect(result.comparisons[0].delta).toBe(3)
  })

  it('excludes semesters without data and does not crash on a single data point', () => {
    const result = compareSemesters([semesterAvg('1. HJ', null), semesterAvg('2. HJ', 2.5)])
    expect(result.withData).toHaveLength(1)
    expect(result.comparisons).toHaveLength(0)
  })

  it('skips a comparison across a scale change instead of computing a misleading delta', () => {
    const result = compareSemesters([semesterAvg('Q4', 2.0, 'grade_1_6'), semesterAvg('Q1', 10, 'points_0_15')])
    expect(result.comparisons).toHaveLength(0)
  })
})

describe('computeScoreDeltaSince', () => {
  const points = [
    { date: '2026-01-01', average: 3, scale: 'grade_1_6' as const, score: 60 },
    { date: '2026-02-01', average: 2, scale: 'grade_1_6' as const, score: 80 },
  ]

  it('computes a positive delta when performance improved', () => {
    const result = computeScoreDeltaSince(points, '2026-01-15')
    expect(result).toEqual({ delta: 20, improved: true })
  })

  it('returns null when there is nothing before the cutoff', () => {
    expect(computeScoreDeltaSince(points, '2025-12-01')).toBeNull()
  })

  it('returns null when there is nothing at or after the cutoff', () => {
    expect(computeScoreDeltaSince(points, '2026-06-01')).toBeNull()
  })
})
