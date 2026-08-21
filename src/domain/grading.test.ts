import { describe, expect, it } from 'vitest'
import {
  calculateWeightedAverage,
  categoryAverage,
  formatDateDe,
  formatGradeValue,
  formatNumberDe,
  formatPercent,
  overallAverage,
  performanceScore,
  performanceTierFromScore,
  simulateNewEntry,
  subjectAverage,
  validateCategoryWeight,
  validateEntryWeight,
  validateGradeValue,
  type ScaledEntry,
} from './grading'

function entry(value: number, weight = 1, scale: 'grade_1_6' | 'points_0_15' = 'grade_1_6'): ScaledEntry {
  return { value, weight, scale }
}

describe('calculateWeightedAverage', () => {
  it('returns null for no entries', () => {
    expect(calculateWeightedAverage([])).toBeNull()
  })

  it('weights entries proportionally', () => {
    // 2 with 1x, 3 with 1x, 1 with 2x => (2 + 3 + 2) / 4 = 1.75
    const avg = calculateWeightedAverage([
      { value: 2, weight: 1 },
      { value: 3, weight: 1 },
      { value: 1, weight: 2 },
    ])
    expect(avg).toBeCloseTo(1.75)
  })

  it('falls back to a plain mean when all weights are zero', () => {
    const avg = calculateWeightedAverage([
      { value: 2, weight: 0 },
      { value: 4, weight: 0 },
    ])
    expect(avg).toBe(3)
  })
})

describe('categoryAverage', () => {
  it('returns empty result for a category with no grades', () => {
    const result = categoryAverage([])
    expect(result.value).toBeNull()
    expect(result.mixedScales).toBe(false)
  })

  it('computes the weighted average from the spec example', () => {
    const result = categoryAverage([entry(2, 1), entry(3, 1), entry(1, 2)])
    expect(result.value).toBeCloseTo(1.75)
    expect(result.scale).toBe('grade_1_6')
    expect(result.mixedScales).toBe(false)
  })

  it('treats a missing individual weight as 1x when the caller defaults it', () => {
    const result = categoryAverage([entry(2), entry(4)])
    expect(result.value).toBeCloseTo(3)
  })

  it('flags mixed scales instead of blending them', () => {
    const result = categoryAverage([entry(2, 1, 'grade_1_6'), entry(11, 1, 'points_0_15')])
    expect(result.value).toBeNull()
    expect(result.mixedScales).toBe(true)
  })

  it('single entry returns that value', () => {
    const result = categoryAverage([entry(4)])
    expect(result.value).toBe(4)
  })
})

describe('subjectAverage', () => {
  it('follows the spec example: Schulaufgaben 2.0 (w2), Mündlich 3.0 (w1) => 2.33', () => {
    const result = subjectAverage([
      { average: { value: 2.0, scale: 'grade_1_6', mixedScales: false }, weight: 2 },
      { average: { value: 3.0, scale: 'grade_1_6', mixedScales: false }, weight: 1 },
    ])
    expect(result.value).toBeCloseTo(2.33, 2)
    expect(result.scale).toBe('grade_1_6')
  })

  it('excludes categories without grades instead of dragging the average down', () => {
    const withEmpty = subjectAverage([
      { average: { value: 2, scale: 'grade_1_6', mixedScales: false }, weight: 1 },
      { average: { value: null, scale: null, mixedScales: false }, weight: 1 }, // no grades yet
    ])
    expect(withEmpty.value).toBe(2)
  })

  it('falls back to a plain mean when all active category weights are 0', () => {
    const result = subjectAverage([
      { average: { value: 2, scale: 'grade_1_6', mixedScales: false }, weight: 0 },
      { average: { value: 4, scale: 'grade_1_6', mixedScales: false }, weight: 0 },
    ])
    expect(result.value).toBe(3)
  })

  it('a single category with weight 0 among others is excluded from the weighted split', () => {
    const result = subjectAverage([
      { average: { value: 2, scale: 'grade_1_6', mixedScales: false }, weight: 1 },
      { average: { value: 6, scale: 'grade_1_6', mixedScales: false }, weight: 0 },
    ])
    expect(result.value).toBe(2)
  })

  it('returns no value when there are no categories with grades at all', () => {
    const result = subjectAverage([
      { average: { value: null, scale: null, mixedScales: false }, weight: 1 },
      { average: { value: null, scale: null, mixedScales: false }, weight: 1 },
    ])
    expect(result.value).toBeNull()
    expect(result.mixedScales).toBe(false)
  })

  it('flags mixed scales across categories instead of computing a misleading number', () => {
    const result = subjectAverage([
      { average: { value: 2, scale: 'grade_1_6', mixedScales: false }, weight: 1 },
      { average: { value: 11, scale: 'points_0_15', mixedScales: false }, weight: 1 },
    ])
    expect(result.value).toBeNull()
    expect(result.mixedScales).toBe(true)
  })

  it('propagates an internally mixed category as a mixed subject, with no misleading value', () => {
    const result = subjectAverage([
      { average: { value: null, scale: null, mixedScales: true }, weight: 1 },
      { average: { value: 2, scale: 'grade_1_6', mixedScales: false }, weight: 1 },
    ])
    expect(result.mixedScales).toBe(true)
    expect(result.value).toBeNull()
  })
})

describe('overallAverage', () => {
  it('excludes subjects without grades yet', () => {
    const result = overallAverage([
      { average: { value: 2, scale: 'grade_1_6', mixedScales: false }, weight: 1 },
      { average: { value: null, scale: null, mixedScales: false }, weight: 1 },
    ])
    expect(result.value).toBe(2)
  })

  it('defaults every subject to equal weight', () => {
    const result = overallAverage([
      { average: { value: 1, scale: 'grade_1_6', mixedScales: false }, weight: 1 },
      { average: { value: 3, scale: 'grade_1_6', mixedScales: false }, weight: 1 },
    ])
    expect(result.value).toBe(2)
  })

  it('refuses to mix grade_1_6 and points_0_15 subjects into one overall average', () => {
    const result = overallAverage([
      { average: { value: 2, scale: 'grade_1_6', mixedScales: false }, weight: 1 },
      { average: { value: 12, scale: 'points_0_15', mixedScales: false }, weight: 1 },
    ])
    expect(result.value).toBeNull()
    expect(result.mixedScales).toBe(true)
  })

  it('returns an empty (not mixed) result when no subject has grades yet', () => {
    const result = overallAverage([])
    expect(result.value).toBeNull()
    expect(result.mixedScales).toBe(false)
  })
})

describe('performanceScore', () => {
  it('maps grade_1_6 boundaries: 1 -> 100, 6 -> 0', () => {
    expect(performanceScore(1, 'grade_1_6')).toBe(100)
    expect(performanceScore(6, 'grade_1_6')).toBe(0)
    expect(performanceScore(3.5, 'grade_1_6')).toBeCloseTo(50)
  })

  it('maps points_0_15 boundaries: 0 -> 0, 15 -> 100', () => {
    expect(performanceScore(0, 'points_0_15')).toBe(0)
    expect(performanceScore(15, 'points_0_15')).toBe(100)
    expect(performanceScore(7.5, 'points_0_15')).toBeCloseTo(50)
  })

  it('clamps out-of-range input into 0..100', () => {
    expect(performanceScore(7, 'grade_1_6')).toBe(0)
    expect(performanceScore(-1, 'points_0_15')).toBe(0)
  })
})

describe('performanceTierFromScore', () => {
  it.each([
    [100, 'excellent'],
    [85, 'excellent'],
    [84, 'good'],
    [70, 'good'],
    [69, 'medium'],
    [50, 'medium'],
    [49, 'warning'],
    [30, 'warning'],
    [29, 'critical'],
    [0, 'critical'],
  ] as const)('score %d -> %s', (score, tier) => {
    expect(performanceTierFromScore(score)).toBe(tier)
  })
})

describe('validateGradeValue', () => {
  it.each([1, 2, 3, 4, 5, 6])('accepts %d on grade_1_6', (v) => {
    expect(validateGradeValue(v, 'grade_1_6').valid).toBe(true)
  })

  it.each([0, 7, -1, 2.5])('rejects %d on grade_1_6', (v) => {
    expect(validateGradeValue(v, 'grade_1_6').valid).toBe(false)
  })

  it.each([0, 8, 15])('accepts %d on points_0_15', (v) => {
    expect(validateGradeValue(v, 'points_0_15').valid).toBe(true)
  })

  it.each([-1, 16, 7.5])('rejects %d on points_0_15', (v) => {
    expect(validateGradeValue(v, 'points_0_15').valid).toBe(false)
  })
})

describe('validateCategoryWeight', () => {
  it('allows 0 (a category can be zero-weighted)', () => {
    expect(validateCategoryWeight(0).valid).toBe(true)
  })
  it('rejects negative weights', () => {
    expect(validateCategoryWeight(-1).valid).toBe(false)
  })
})

describe('validateEntryWeight', () => {
  it('rejects 0 and negative weights', () => {
    expect(validateEntryWeight(0).valid).toBe(false)
    expect(validateEntryWeight(-2).valid).toBe(false)
  })
  it('accepts positive weights', () => {
    expect(validateEntryWeight(2).valid).toBe(true)
  })
})

describe('formatGradeValue / formatNumberDe', () => {
  it('formats grade_1_6 with two decimals and a German comma', () => {
    expect(formatGradeValue(1.75, 'grade_1_6')).toBe('1,75')
    expect(formatNumberDe(2.3333, 2)).toBe('2,33')
  })

  it('formats points_0_15 as whole points with a trailing "P."', () => {
    expect(formatGradeValue(11, 'points_0_15')).toBe('11 P.')
    expect(formatGradeValue(10.5, 'points_0_15')).toBe('10,5 P.')
  })
})

describe('formatPercent', () => {
  it('formats and rounds a share as a German percentage', () => {
    expect(formatPercent(50)).toBe('50 %')
    expect(formatPercent(33.333)).toBe('33 %')
    expect(formatPercent(0)).toBe('0 %')
  })
})

describe('formatDateDe', () => {
  it('formats an ISO date the German way', () => {
    expect(formatDateDe('2026-08-21')).toBe('21.08.2026')
  })

  it('formats a full ISO timestamp the German way', () => {
    expect(formatDateDe('2026-01-05T10:00:00.000Z')).toBe('05.01.2026')
  })

  it('returns a dash for an invalid date instead of "Invalid Date"', () => {
    expect(formatDateDe('not-a-date')).toBe('–')
  })
})

describe('simulateNewEntry', () => {
  it('computes the delta a hypothetical new entry would cause', () => {
    const { before, after, delta } = simulateNewEntry([{ value: 2, weight: 1 }], { value: 4, weight: 1 })
    expect(before).toBe(2)
    expect(after).toBe(3)
    expect(delta).toBe(1)
  })
})
