import { describe, expect, it } from 'vitest'
import { calculateAbiResult, calculateBlockI, calculateBlockII } from './calculator'
import { BAVARIA_GYMNASIUM_2027_V1 } from './states/by'

const config = BAVARIA_GYMNASIUM_2027_V1

describe('calculateBlockI', () => {
  it('sums known half-year results and flags a provisional count when it does not match the required 40', () => {
    const result = calculateBlockI(config, [
      { semesterName: '12/1', points: 12 },
      { semesterName: '12/1', points: 10 },
      { semesterName: '12/2', points: 14 },
    ])
    expect(result.completedPoints).toBe(36)
    expect(result.completedCount).toBe(3)
    expect(result.requiredCount).toBe(40)
    expect(result.isProvisional).toBe(true)
    expect(result.maxPoints).toBe(600)
    expect(result.minPoints).toBe(200)
  })

  it('rounds fractional half-year sums to whole points (KMK rounding: .5 rounds up)', () => {
    // Realistic case: a subject's own average lands on a half point before Block I rounding.
    const result = calculateBlockI(config, [{ semesterName: '12/1', points: 10.5 }])
    expect(result.completedPoints).toBe(11)
  })

  it('ignores unknown (null) results entirely — never treats them as 0', () => {
    const result = calculateBlockI(config, [
      { semesterName: '12/1', points: 15 },
      { semesterName: '12/2', points: null },
    ])
    expect(result.completedPoints).toBe(15)
    expect(result.completedCount).toBe(1)
  })

  it('is not provisional once exactly 40 results are known', () => {
    const results = Array.from({ length: 40 }, (_, i) => ({ semesterName: '12/1', points: (i % 16) as number }))
    const result = calculateBlockI(config, results)
    expect(result.isProvisional).toBe(false)
    expect(result.completedCount).toBe(40)
  })
})

describe('calculateBlockII', () => {
  it('applies the 4x exam weighting per subject', () => {
    const result = calculateBlockII(config, [
      { subjectLabel: 'Deutsch', points: 10 },
      { subjectLabel: 'Mathematik', points: 12 },
    ])
    expect(result.completedPoints).toBe(10 * 4 + 12 * 4)
    expect(result.completedCount).toBe(2)
    expect(result.requiredCount).toBe(5)
    expect(result.isProvisional).toBe(true)
  })

  it('reaches the documented maximum of 300 with five 15-point exams', () => {
    const results = Array.from({ length: 5 }, () => ({ subjectLabel: 'x', points: 15 }))
    const result = calculateBlockII(config, results)
    expect(result.completedPoints).toBe(300)
    expect(result.isProvisional).toBe(false)
  })

  it('ignores unknown exam results', () => {
    const result = calculateBlockII(config, [
      { subjectLabel: 'Deutsch', points: 10 },
      { subjectLabel: 'Mathematik', points: null },
    ])
    expect(result.completedPoints).toBe(40)
    expect(result.completedCount).toBe(1)
  })
})

describe('calculateAbiResult', () => {
  it('sums Block I and Block II into the total and never fabricates a final grade when unavailable', () => {
    const blockI = calculateBlockI(config, [{ semesterName: '12/1', points: 12 }])
    const blockII = calculateBlockII(config, [{ subjectLabel: 'Deutsch', points: 10 }])
    const result = calculateAbiResult({
      config,
      blockI,
      blockII,
      knownResultsCount: 2,
      predictedResultsCount: 0,
      warnings: [],
      assumptions: [],
    })
    expect(result.totalPoints.completed).toBe(12 + 40)
    expect(result.totalPoints.max).toBe(900)
    expect(result.finalGrade.available).toBe(false)
    expect(result.finalGrade.value).toBeNull()
    expect(result.finalGrade.note.length).toBeGreaterThan(0)
  })

  it('carries the config verified flag through unchanged', () => {
    const blockI = calculateBlockI(config, [])
    const blockII = calculateBlockII(config, [])
    const result = calculateAbiResult({
      config,
      blockI,
      blockII,
      knownResultsCount: 0,
      predictedResultsCount: 0,
      warnings: [],
      assumptions: [],
    })
    expect(result.verified).toBe(true)
    expect(result.state).toBe('BY')
    expect(result.ruleVersion).toBe('BY_GYM_2027_V1')
  })
})
