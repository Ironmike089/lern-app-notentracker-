import { describe, expect, it } from 'vitest'
import {
  calculateConsistency,
  calculateImprovement,
  calculateStreakAboveRunningAverage,
  calculateStreakAboveThreshold,
  calculateWrittenVsOral,
  compareSemesters,
  computeGradeDistribution,
  computeOverallStatus,
  computeScoreDeltaSince,
  computeSubjectTrend,
  type PeriodImprovement,
  type SemesterAverageInput,
  type TrendEntryInput,
  type TrendPoint,
} from './analytics'
import type { AverageResult } from './grading'

function improvement(overrides: Partial<PeriodImprovement>): PeriodImprovement {
  return { gradeDelta: 0, scoreDelta: 0, scale: 'grade_1_6', improved: false, ...overrides }
}

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

function point(overrides: Partial<TrendPoint>): TrendPoint {
  return { date: '2026-01-01', average: 3, scale: 'grade_1_6', score: 60, ...overrides }
}

describe('calculateImprovement', () => {
  it('computes a matching grade-scale and score-scale improvement for grade_1_6 (lower is better)', () => {
    const points = [point({ date: '2026-01-01', average: 3, score: 60 }), point({ date: '2026-02-01', average: 2, score: 80 })]
    const result = calculateImprovement(points, '2026-01-15')
    expect(result).toEqual({ gradeDelta: -1, scoreDelta: 20, scale: 'grade_1_6', improved: true })
  })

  it('computes a matching improvement for points_0_15 (higher is better)', () => {
    const points = [
      point({ date: '2026-01-01', average: 8, scale: 'points_0_15', score: (8 / 15) * 100 }),
      point({ date: '2026-02-01', average: 12, scale: 'points_0_15', score: (12 / 15) * 100 }),
    ]
    const result = calculateImprovement(points, '2026-01-15')
    expect(result?.improved).toBe(true)
    expect(result?.gradeDelta).toBeCloseTo(4)
  })

  it('detects a worsening trend', () => {
    const points = [point({ date: '2026-01-01', average: 2, score: 80 }), point({ date: '2026-02-01', average: 4, score: 40 })]
    const result = calculateImprovement(points, '2026-01-15')
    expect(result?.improved).toBe(false)
    expect(result?.gradeDelta).toBe(2)
  })

  it('returns null without a point on each side of the cutoff', () => {
    const points = [point({ date: '2026-01-01' }), point({ date: '2026-01-10' })]
    expect(calculateImprovement(points, '2026-06-01')).toBeNull()
  })

  it('returns null across a scale change (nothing honest to compare)', () => {
    const points = [
      point({ date: '2026-01-01', scale: 'grade_1_6' }),
      point({ date: '2026-02-01', scale: 'points_0_15' }),
    ]
    expect(calculateImprovement(points, '2026-01-15')).toBeNull()
  })
})

describe('calculateConsistency', () => {
  it('labels near-identical scores as very consistent', () => {
    const result = calculateConsistency([80, 82, 79, 81, 80])
    expect(result?.label).toBe('sehr konstant')
  })

  it('labels moderately varying scores as consistent', () => {
    const result = calculateConsistency([70, 82, 65, 75, 88])
    expect(result?.label).toBe('konstant')
  })

  it('labels wildly varying scores as fluctuating', () => {
    const result = calculateConsistency([20, 95, 15, 90, 10])
    expect(result?.label).toBe('schwankend')
  })

  it('returns null with fewer than 3 data points', () => {
    expect(calculateConsistency([80, 90])).toBeNull()
    expect(calculateConsistency([])).toBeNull()
  })

  it('never produces NaN or a negative standard deviation', () => {
    const result = calculateConsistency([50, 50, 50, 50])
    expect(result?.standardDeviation).toBe(0)
    expect(Number.isNaN(result?.standardDeviation)).toBe(false)
  })
})

describe('calculateWrittenVsOral', () => {
  it('compares written and oral averages when both have data', () => {
    const written = [{ value: 2, scale: 'grade_1_6' as const }, { value: 3, scale: 'grade_1_6' as const }]
    const oral = [{ value: 1, scale: 'grade_1_6' as const }, { value: 2, scale: 'grade_1_6' as const }]
    const result = calculateWrittenVsOral(written, oral)
    expect(result?.written.value).toBeCloseTo(2.5)
    expect(result?.oral.value).toBeCloseTo(1.5)
  })

  it('returns null when written data is missing', () => {
    expect(calculateWrittenVsOral([], [{ value: 1, scale: 'grade_1_6' }])).toBeNull()
  })

  it('returns null when oral data is missing', () => {
    expect(calculateWrittenVsOral([{ value: 1, scale: 'grade_1_6' }], [])).toBeNull()
  })

  it('returns null when both are empty', () => {
    expect(calculateWrittenVsOral([], [])).toBeNull()
  })
})

describe('calculateStreakAboveThreshold', () => {
  it('counts the trailing run at or above the threshold', () => {
    expect(calculateStreakAboveThreshold([40, 90, 85, 95, 88], 70)).toBe(4)
  })

  it('returns 0 when the last entry is below the threshold', () => {
    expect(calculateStreakAboveThreshold([90, 95, 40], 70)).toBe(0)
  })

  it('returns the full length when everything clears the threshold', () => {
    expect(calculateStreakAboveThreshold([80, 85, 90], 70)).toBe(3)
  })

  it('returns 0 for an empty list', () => {
    expect(calculateStreakAboveThreshold([], 70)).toBe(0)
  })
})

describe('calculateStreakAboveRunningAverage', () => {
  it('counts entries that each beat the average of everything before them', () => {
    // avg before index2=50 -> 60>50 counts; avg before index3=(40+60)/2=50 -> 70>50 counts; avg before index4=(40+60+70)/3=56.7 -> 80>that counts
    expect(calculateStreakAboveRunningAverage([40, 60, 70, 80])).toBe(3)
  })

  it('stops counting at the first entry that does not beat the running average', () => {
    expect(calculateStreakAboveRunningAverage([40, 80, 30, 90])).toBe(1)
  })

  it('returns 0 for a single entry (nothing prior to compare against)', () => {
    expect(calculateStreakAboveRunningAverage([80])).toBe(0)
  })

  it('returns 0 for an empty list', () => {
    expect(calculateStreakAboveRunningAverage([])).toBe(0)
  })
})

describe('computeOverallStatus', () => {
  it('reports insufficient data when the tier is missing', () => {
    expect(computeOverallStatus(null, improvement({ scoreDelta: 10, improved: true })).kind).toBe(
      'insufficient-data',
    )
  })

  it('reports insufficient data when the improvement is missing', () => {
    expect(computeOverallStatus('good', null).kind).toBe('insufficient-data')
  })

  it('reports strong for an excellent tier, even with a small delta', () => {
    expect(computeOverallStatus('excellent', improvement({ scoreDelta: 1 })).kind).toBe('strong')
  })

  it('reports stable when the score barely moved', () => {
    expect(computeOverallStatus('good', improvement({ scoreDelta: 1, improved: true })).kind).toBe('stable')
  })

  it('reports improving for a meaningful positive delta', () => {
    expect(computeOverallStatus('good', improvement({ scoreDelta: 10, improved: true })).kind).toBe('improving')
  })

  it('reports declining for a meaningful negative delta', () => {
    expect(computeOverallStatus('medium', improvement({ scoreDelta: -10, improved: false })).kind).toBe('declining')
  })
})
