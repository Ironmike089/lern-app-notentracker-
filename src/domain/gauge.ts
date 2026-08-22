/**
 * Pure geometry for the semicircular PerformanceGauge — kept separate from
 * the SVG-rendering component so the score→angle mapping (the part that
 * actually has to be correct) is unit-testable without a DOM/component
 * testing setup. 0 always sits at 180° (far left, red end of the arc) and
 * 100 at 0° (far right, green end) — the same shared performanceScore()
 * that drives every other color/position in the app, just placed on a
 * half-circle instead of a horizontal bar.
 */

export function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score))
}

/** Angle in degrees (standard math convention: 0°=right, 90°=up, 180°=left) for a given 0–100 score. Always within [0, 180]. */
export function gaugeNeedleAngle(score: number): number {
  const clamped = clampScore(score)
  return 180 - (clamped / 100) * 180
}

export function gaugePointOnArc(
  angleDeg: number,
  radius: number,
  center: { cx: number; cy: number },
): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: center.cx + radius * Math.cos(rad), y: center.cy - radius * Math.sin(rad) }
}
