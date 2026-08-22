import { BAVARIA_GYMNASIUM_2027_V1 } from './by'

/**
 * Bavaria-specific derived math that doesn't belong in the generic
 * calculator.ts (calculator.ts only knows "N half-year results + M
 * weighted exams" — the W-Seminar's own 3:1-weighted, 30-point score is a
 * Bavaria-only shape). See BAVARIA_GYMNASIUM_2027_V1.seminarModules[0]
 * .scoringFormulaNote for the honesty caveat on this exact formula.
 */
export function calculateBavariaSeminarScore(
  seminarPaperPoints: number | null,
  presentationPoints: number | null,
): number | null {
  if (seminarPaperPoints === null || presentationPoints === null) return null
  const { seminarPaperWeight, presentationWeight, maxPoints } = BAVARIA_GYMNASIUM_2027_V1.seminarModules[0]
  const totalWeight = seminarPaperWeight + presentationWeight
  const rawMax = 15 * totalWeight
  const raw = seminarPaperPoints * seminarPaperWeight + presentationPoints * presentationWeight
  return Math.round((raw / rawMax) * maxPoints)
}
