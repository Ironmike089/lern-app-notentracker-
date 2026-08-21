import { describe, expect, it } from 'vitest'
import { buildDefaultSchoolYear } from './schoolYearService'

describe('buildDefaultSchoolYear', () => {
  it('creates two Halbjahre for regular students, with the right one marked current', () => {
    const nov = new Date(2026, 10, 15) // November -> 1. Halbjahr
    const { semesters } = buildDefaultSchoolYear({ upperSecondary: false }, nov)
    expect(semesters.map((s) => s.label)).toEqual(['1. Halbjahr', '2. Halbjahr'])
    expect(semesters.find((s) => s.isCurrent)?.label).toBe('1. Halbjahr')

    const march = new Date(2026, 2, 10) // March -> 2. Halbjahr
    const { semesters: semesters2 } = buildDefaultSchoolYear({ upperSecondary: false }, march)
    expect(semesters2.find((s) => s.isCurrent)?.label).toBe('2. Halbjahr')
  })

  it('creates four Kurshalbjahre (Q1-Q4) for upper-secondary students', () => {
    const { semesters } = buildDefaultSchoolYear({ upperSecondary: true }, new Date(2026, 0, 1))
    expect(semesters.map((s) => s.label)).toEqual(['Q1', 'Q2', 'Q3', 'Q4'])
    expect(semesters.filter((s) => s.isCurrent)).toHaveLength(1)
  })

  it.each([
    [7, 'Q1'], // August
    [9, 'Q1'], // October
    [10, 'Q2'], // November
    [0, 'Q2'], // January
    [1, 'Q3'], // February
    [3, 'Q3'], // April
    [4, 'Q4'], // May
    [6, 'Q4'], // July
  ])('month index %d maps to %s', (month, expectedLabel) => {
    const { semesters } = buildDefaultSchoolYear({ upperSecondary: true }, new Date(2026, month, 1))
    expect(semesters.find((s) => s.isCurrent)?.label).toBe(expectedLabel)
  })

  it('school year label spans Aug-start to Jul-end', () => {
    const { schoolYear } = buildDefaultSchoolYear({ upperSecondary: false }, new Date(2026, 8, 1))
    expect(schoolYear.label).toBe('2026/2027')

    const { schoolYear: earlyYear } = buildDefaultSchoolYear({ upperSecondary: false }, new Date(2026, 2, 1))
    expect(earlyYear.label).toBe('2025/2026')
  })
})
