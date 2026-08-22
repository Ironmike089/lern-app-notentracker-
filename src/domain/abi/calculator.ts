import type { AbiCalculationResult, BlockResult, StateRuleConfig } from './types'

/**
 * Pure, state-agnostic Abitur math — every number here comes from the
 * StateRuleConfig passed in, never a hardcoded constant. A new verified
 * state config can reuse this file unchanged as long as its structure fits
 * the same "N Halbjahresleistungen + M weighted exams" shape Bavaria and
 * (per docs/abi-rules-audit.md) apparently most KMK-based states share.
 */

export interface HalfYearResultInput {
  semesterName: string
  /** 0–15, or null while not yet known. */
  points: number | null
}

export interface ExamResultInput {
  subjectLabel: string
  /** Raw 0–15, before the config's examWeighting is applied. Null while not yet known. */
  points: number | null
}

function roundToWholePoints(value: number): number {
  // KMK rule: round to whole points, .5 rounds up.
  return Math.floor(value + 0.5)
}

export function calculateBlockI(config: StateRuleConfig, results: HalfYearResultInput[]): BlockResult {
  const known = results.filter((r): r is { semesterName: string; points: number } => r.points !== null)
  const completedPoints = roundToWholePoints(known.reduce((sum, r) => sum + r.points, 0))
  const requiredCount = config.qualificationPhase.requiredContributions

  return {
    completedPoints,
    maxPoints: config.qualificationPhase.maxPoints,
    minPoints: config.qualificationPhase.minPoints,
    completedCount: known.length,
    requiredCount,
    isProvisional: known.length !== requiredCount,
  }
}

export function calculateBlockII(config: StateRuleConfig, results: ExamResultInput[]): BlockResult {
  const known = results.filter((r): r is { subjectLabel: string; points: number } => r.points !== null)
  const completedPoints = known.reduce((sum, r) => sum + r.points * config.examBlock.examWeighting, 0)
  const requiredCount = config.examBlock.examCount

  return {
    completedPoints,
    maxPoints: config.examBlock.maxPoints,
    minPoints: config.examBlock.minPoints,
    completedCount: known.length,
    requiredCount,
    isProvisional: known.length !== requiredCount,
  }
}

export interface CalculateAbiResultInput {
  config: StateRuleConfig
  blockI: BlockResult
  blockII: BlockResult
  knownResultsCount: number
  predictedResultsCount: number
  warnings: string[]
  assumptions: string[]
}

export function calculateAbiResult({
  config,
  blockI,
  blockII,
  knownResultsCount,
  predictedResultsCount,
  warnings,
  assumptions,
}: CalculateAbiResultInput): AbiCalculationResult {
  const completedTotal = blockI.completedPoints + blockII.completedPoints

  return {
    state: config.state,
    ruleVersion: config.ruleVersion,
    verified: config.verified,
    blockI,
    blockII,
    totalPoints: { completed: completedTotal, max: config.totalPoints.max, min: config.totalPoints.min },
    finalGrade: config.gradeConversion.available
      ? { available: true, value: null, note: 'Umrechnung noch nicht implementiert.' }
      : { available: false, value: null, note: config.gradeConversion.note },
    knownResultsCount,
    predictedResultsCount,
    warnings,
    assumptions,
  }
}
