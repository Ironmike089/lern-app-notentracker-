import type { GradingScale, StateCode } from '../types'

/**
 * Types for the per-Bundesland Abitur rule engine. A StateRuleConfig is
 * only ever built once its numbers have been checked against an official
 * source — see docs/abi-rules-audit.md for exactly what was verified and
 * how. `verified: false` (or a field simply absent) means "not implemented
 * yet", never "implemented with a guess".
 */

export interface AbiSourceReference {
  label: string
  url: string
}

export type AbiSchoolType = 'gymnasium'

export interface QualificationPhaseConfig {
  /** Official semester/Ausbildungsabschnitt names, in order, e.g. ['12/1','12/2','13/1','13/2']. */
  semesterNames: string[]
  /** How many Halbjahresleistungen must be included ("Block I" contribution count). */
  requiredContributions: number
  maxPoints: number
  minPoints: number
}

export interface ExamBlockConfig {
  examCount: number
  /** Multiplier applied to each exam's raw 0–15 result, e.g. 4. */
  examWeighting: number
  maxPointsPerExam: number
  maxPoints: number
  minPoints: number
  writtenExamCount: number
  oralExamCount: number
}

export interface SeminarModuleConfig {
  id: string
  label: string
  /** Semester names (subset of qualificationPhase.semesterNames) the module spans. */
  semesterNames: string[]
  seminarPaperWeight: number
  presentationWeight: number
  maxPoints: number
  /** Always false in every verified config so far — shown separately, not folded into a normal Halbjahresleistung slot. */
  countsAsHalfYearGrade: false
  /** Honest disclosure when the exact scoring formula was derived from two verified facts rather than read literally. */
  scoringFormulaNote: string
}

export interface GradeConversionConfig {
  available: boolean
  note: string
}

export interface StateRuleConfig {
  state: StateCode
  schoolType: AbiSchoolType
  /** Immutable identifier, e.g. 'BY_GYM_2027_V1' — never silently swapped for a newer version under a profile that pinned this one. */
  ruleVersion: string
  graduationYearFrom: number
  graduationYearTo?: number
  validFrom: string
  verified: boolean
  lastVerifiedAt: string
  sourceReferences: AbiSourceReference[]
  gradingScale: GradingScale
  qualificationPhase: QualificationPhaseConfig
  examBlock: ExamBlockConfig
  totalPoints: { max: number; min: number }
  seminarModules: SeminarModuleConfig[]
  gradeConversion: GradeConversionConfig
  /** Field keys the onboarding wizard must collect for this state — drives requiredSetupFields-based step generation instead of an if/else chain per state. */
  requiredSetupFields: string[]
  /** Sub-rules explicitly NOT implemented (deficit rules, contribution/discard rules, ...) — always disclosed, never silently assumed. */
  unverifiedAspects: string[]
}

// ---------------------------------------------------------------------------
// Calculation results
// ---------------------------------------------------------------------------

export interface BlockResult {
  completedPoints: number
  maxPoints: number
  minPoints: number
  completedCount: number
  requiredCount: number
  /** True when completedCount doesn't match requiredCount — the figure is real but not yet the legally exact one. */
  isProvisional: boolean
}

export interface AbiCalculationResult {
  state: StateCode
  ruleVersion: string
  verified: boolean
  blockI: BlockResult
  blockII: BlockResult
  totalPoints: { completed: number; max: number; min: number }
  finalGrade: { available: boolean; value: number | null; note: string }
  knownResultsCount: number
  predictedResultsCount: number
  warnings: string[]
  assumptions: string[]
}

export type ProjectionMode = 'manual' | 'currentAverage' | 'trend'

export interface EligibilityCheck {
  id: string
  label: string
  status: 'met' | 'unmet' | 'unknown'
  detail: string
}
