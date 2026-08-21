import { describe, expect, it } from 'vitest'
import { solveRequiredValue, type OtherCategoryInput } from './goalSolver'
import type { AverageResult } from './grading'

function avg(value: number | null, scale: AverageResult['scale'] = 'grade_1_6', mixedScales = false): AverageResult {
  return { value, scale, mixedScales }
}

describe('solveRequiredValue', () => {
  it('solves the only category directly against the target (grade_1_6)', () => {
    const result = solveRequiredValue([], { weight: 1, entries: [] }, 2.0, 'grade_1_6')
    expect(result).toEqual({ kind: 'achievable', requiredValue: 2, exactValue: 2 })
  })

  it('accounts for another category already at the target — needs the same again', () => {
    const others: OtherCategoryInput[] = [{ weight: 2, average: avg(2.0) }]
    const result = solveRequiredValue(others, { weight: 1, entries: [] }, 2.0, 'grade_1_6')
    expect(result).toEqual({ kind: 'achievable', requiredValue: 2, exactValue: 2 })
  })

  it('requires the best possible grade when another category is weak, matching the spec example', () => {
    const others: OtherCategoryInput[] = [{ weight: 1, average: avg(3.0) }]
    const result = solveRequiredValue(others, { weight: 1, entries: [] }, 2.0, 'grade_1_6')
    expect(result).toEqual({ kind: 'achievable', requiredValue: 1, exactValue: 1 })
  })

  it('reports unreachable when even a 1 would not be good enough', () => {
    const others: OtherCategoryInput[] = [{ weight: 1, average: avg(4.0) }]
    const result = solveRequiredValue(others, { weight: 1, entries: [] }, 2.0, 'grade_1_6')
    expect(result.kind).toBe('unreachable')
  })

  it('reports already-guaranteed when even the worst grade keeps the goal', () => {
    const others: OtherCategoryInput[] = [{ weight: 1, average: avg(1.0) }]
    const result = solveRequiredValue(others, { weight: 1, entries: [] }, 4.0, 'grade_1_6')
    expect(result.kind).toBe('already-guaranteed')
  })

  it('folds existing weighted entries in the target category into the calculation', () => {
    const others: OtherCategoryInput[] = [{ weight: 1, average: avg(2.0) }]
    const target = { weight: 1, entries: [{ value: 2, weight: 1 }, { value: 2, weight: 1 }] }
    const result = solveRequiredValue(others, target, 2.0, 'grade_1_6')
    expect(result).toEqual({ kind: 'achievable', requiredValue: 2, exactValue: 2 })
  })

  it('respects a non-default weight for the hypothetical next entry', () => {
    const others: OtherCategoryInput[] = [{ weight: 1, average: avg(2.0) }]
    const result = solveRequiredValue(others, { weight: 1, entries: [] }, 1.5, 'grade_1_6', 2)
    expect(result).toEqual({ kind: 'achievable', requiredValue: 1, exactValue: 1 })
  })

  it('works in the points_0_15 direction (higher is better)', () => {
    const others: OtherCategoryInput[] = [{ weight: 1, average: avg(10, 'points_0_15') }]
    const result = solveRequiredValue(others, { weight: 1, entries: [] }, 12, 'points_0_15')
    expect(result).toEqual({ kind: 'achievable', requiredValue: 14, exactValue: 14 })
  })

  it('reports unreachable on points_0_15 when even a 15 is not enough', () => {
    const others: OtherCategoryInput[] = [{ weight: 1, average: avg(5, 'points_0_15') }]
    const result = solveRequiredValue(others, { weight: 1, entries: [] }, 12, 'points_0_15')
    expect(result.kind).toBe('unreachable')
  })

  it('falls back to a plain mean when every usable category (including the target) has weight 0 — matching calculateWeightedAverage', () => {
    const others: OtherCategoryInput[] = [{ weight: 0, average: avg(2.0) }]
    const result = solveRequiredValue(others, { weight: 0, entries: [] }, 3.0, 'grade_1_6')
    expect(result).toEqual({ kind: 'achievable', requiredValue: 4, exactValue: 4 })
  })

  it('reports no-influence when the target category has zero weight among nonzero-weight others', () => {
    const others: OtherCategoryInput[] = [{ weight: 1, average: avg(2.0) }]
    const result = solveRequiredValue(others, { weight: 0, entries: [] }, 2.0, 'grade_1_6')
    expect(result.kind).toBe('no-influence')
  })

  it('reports no-influence for a non-positive next-entry weight instead of dividing by zero', () => {
    const result = solveRequiredValue([], { weight: 1, entries: [] }, 2.0, 'grade_1_6', 0)
    expect(result.kind).toBe('no-influence')
  })

  it('never returns NaN or Infinity', () => {
    const others: OtherCategoryInput[] = [{ weight: 0, average: avg(null, 'grade_1_6', true) }]
    const result = solveRequiredValue(others, { weight: 0, entries: [] }, 2.0, 'grade_1_6')
    if ('exactValue' in result) {
      expect(Number.isFinite(result.exactValue)).toBe(true)
    }
  })

  it('excludes mixed-scale categories from the other-categories sum', () => {
    const others: OtherCategoryInput[] = [
      { weight: 5, average: avg(null, null, true) },
      { weight: 1, average: avg(2.0) },
    ]
    const result = solveRequiredValue(others, { weight: 1, entries: [] }, 2.0, 'grade_1_6')
    expect(result).toEqual({ kind: 'achievable', requiredValue: 2, exactValue: 2 })
  })
})
