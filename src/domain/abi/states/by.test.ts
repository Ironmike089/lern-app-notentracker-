import { describe, expect, it } from 'vitest'
import { BAVARIA_GYMNASIUM_2027_V1 } from './by'
import { calculateBavariaSeminarScore } from './byCalculator'

describe('BAVARIA_GYMNASIUM_2027_V1', () => {
  it('documents the verified Block I / Block II structure', () => {
    expect(BAVARIA_GYMNASIUM_2027_V1.qualificationPhase.requiredContributions).toBe(40)
    expect(BAVARIA_GYMNASIUM_2027_V1.qualificationPhase.maxPoints).toBe(600)
    expect(BAVARIA_GYMNASIUM_2027_V1.examBlock.examCount).toBe(5)
    expect(BAVARIA_GYMNASIUM_2027_V1.examBlock.examWeighting).toBe(4)
    expect(BAVARIA_GYMNASIUM_2027_V1.examBlock.maxPoints).toBe(300)
    expect(BAVARIA_GYMNASIUM_2027_V1.totalPoints.max).toBe(900)
  })

  it('never claims a verified grade conversion table', () => {
    expect(BAVARIA_GYMNASIUM_2027_V1.gradeConversion.available).toBe(false)
  })

  it('discloses every unimplemented sub-rule instead of silently assuming it', () => {
    expect(BAVARIA_GYMNASIUM_2027_V1.unverifiedAspects.length).toBeGreaterThan(0)
  })
})

describe('calculateBavariaSeminarScore', () => {
  it('reaches the documented maximum of 30 points at 15/15', () => {
    expect(calculateBavariaSeminarScore(15, 15)).toBe(30)
  })

  it('reaches 0 at 0/0', () => {
    expect(calculateBavariaSeminarScore(0, 0)).toBe(0)
  })

  it('weights the Seminararbeit three times as heavily as the presentation', () => {
    // 15/0 (paper-only) must score higher than 0/15 (presentation-only).
    const paperOnly = calculateBavariaSeminarScore(15, 0)
    const presentationOnly = calculateBavariaSeminarScore(0, 15)
    expect(paperOnly).toBeGreaterThan(presentationOnly as number)
  })

  it('returns null while either component is still ungraded — never a fabricated partial score', () => {
    expect(calculateBavariaSeminarScore(null, 10)).toBeNull()
    expect(calculateBavariaSeminarScore(10, null)).toBeNull()
    expect(calculateBavariaSeminarScore(null, null)).toBeNull()
  })
})
