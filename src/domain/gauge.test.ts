import { describe, expect, it } from 'vitest'
import { performanceScore } from './grading'
import { clampScore, gaugeNeedleAngle, gaugePointOnArc } from './gauge'

describe('gaugeNeedleAngle', () => {
  it('places the worst score (0) at 180° — the far left, red end', () => {
    expect(gaugeNeedleAngle(0)).toBe(180)
  })

  it('places the best score (100) at 0° — the far right, green end', () => {
    expect(gaugeNeedleAngle(100)).toBe(0)
  })

  it('places the midpoint (50) straight up at 90°', () => {
    expect(gaugeNeedleAngle(50)).toBe(90)
  })

  it('clamps out-of-range scores instead of pointing past the arc', () => {
    expect(gaugeNeedleAngle(-20)).toBe(180)
    expect(gaugeNeedleAngle(150)).toBe(0)
  })

  it('never returns an angle outside the visible semicircle, for any input', () => {
    for (const score of [-100, -1, 0, 1, 25, 49.5, 50, 75, 99, 100, 101, 1000]) {
      const angle = gaugeNeedleAngle(score)
      expect(angle).toBeGreaterThanOrEqual(0)
      expect(angle).toBeLessThanOrEqual(180)
    }
  })

  // The exact example values from the spec: grade_1_6 2,5 / 4,0 and points_0_15 7 / 10 / 13,
  // routed through the same performanceScore() every other component uses.
  it('maps grade_1_6 2,5 (score 70) to 54°', () => {
    const score = performanceScore(2.5, 'grade_1_6')
    expect(score).toBeCloseTo(70)
    expect(gaugeNeedleAngle(score)).toBeCloseTo(54)
  })

  it('maps grade_1_6 4,0 (score 40) to 108°', () => {
    const score = performanceScore(4.0, 'grade_1_6')
    expect(score).toBeCloseTo(40)
    expect(gaugeNeedleAngle(score)).toBeCloseTo(108)
  })

  it('maps points_0_15 7 (score ≈46,67) to ≈96°', () => {
    const score = performanceScore(7, 'points_0_15')
    expect(score).toBeCloseTo(46.667, 2)
    expect(gaugeNeedleAngle(score)).toBeCloseTo(96, 2)
  })

  it('maps points_0_15 10 (score ≈66,67) to 60°', () => {
    const score = performanceScore(10, 'points_0_15')
    expect(score).toBeCloseTo(66.667, 2)
    expect(gaugeNeedleAngle(score)).toBeCloseTo(60, 2)
  })

  it('maps points_0_15 13 (score ≈86,67) to 24°', () => {
    const score = performanceScore(13, 'points_0_15')
    expect(score).toBeCloseTo(86.667, 2)
    expect(gaugeNeedleAngle(score)).toBeCloseTo(24, 2)
  })
})

describe('clampScore', () => {
  it('leaves in-range values untouched', () => {
    expect(clampScore(37)).toBe(37)
  })

  it('clamps to [0, 100]', () => {
    expect(clampScore(-5)).toBe(0)
    expect(clampScore(105)).toBe(100)
  })
})

describe('gaugePointOnArc', () => {
  const center = { cx: 110, cy: 112 }
  const radius = 88

  it('places every point exactly `radius` away from the center — the marker can never drift off the arc', () => {
    for (const angle of [0, 24, 54, 60, 90, 96, 108, 180]) {
      const { x, y } = gaugePointOnArc(angle, radius, center)
      const distance = Math.hypot(x - center.cx, y - center.cy)
      expect(distance).toBeCloseTo(radius, 5)
    }
  })

  it('puts 0° at the right end and 180° at the left end, both level with the center', () => {
    const right = gaugePointOnArc(0, radius, center)
    const left = gaugePointOnArc(180, radius, center)
    expect(right.x).toBeCloseTo(center.cx + radius)
    expect(right.y).toBeCloseTo(center.cy)
    expect(left.x).toBeCloseTo(center.cx - radius)
    expect(left.y).toBeCloseTo(center.cy)
  })

  it('puts 90° directly above the center', () => {
    const top = gaugePointOnArc(90, radius, center)
    expect(top.x).toBeCloseTo(center.cx)
    expect(top.y).toBeCloseTo(center.cy - radius)
  })
})
