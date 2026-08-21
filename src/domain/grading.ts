import type { GradingScale } from './types'

/**
 * The grade calculation engine. Pure functions only — no UI, no storage —
 * so the math can be unit tested in isolation from React and Dexie.
 *
 * Two scales are supported:
 * - grade_1_6: German school grades, 1 = best, 6 = worst (SMALLER is better).
 * - points_0_15: Gymnasiale Oberstufe points, 0 = worst, 15 = best (BIGGER is better).
 *
 * Hierarchy: individual GradeEntry -> categoryAverage -> subjectAverage -> overallAverage.
 * The latter two share one combinator (`combineWeightedResults`) since both are
 * "weighted average of child averages, refusing to blend incompatible scales".
 */

export type PerformanceTier = 'excellent' | 'good' | 'medium' | 'warning' | 'critical'

/** 0 = 6, 15 = 1+, matches the official Punkte-zu-Note orientation table. */
const POINTS_TO_GRADE_LABEL: Record<number, string> = {
  15: '1+',
  14: '1',
  13: '1-',
  12: '2+',
  11: '2',
  10: '2-',
  9: '3+',
  8: '3',
  7: '3-',
  6: '4+',
  5: '4',
  4: '4-',
  3: '5+',
  2: '5',
  1: '5-',
  0: '6',
}

export function isHigherBetter(scale: GradingScale): boolean {
  return scale === 'points_0_15'
}

export function gradeValueBounds(scale: GradingScale): { min: number; max: number } {
  return scale === 'points_0_15' ? { min: 0, max: 15 } : { min: 1, max: 6 }
}

/** Maps a points value (0–15) to its approximate 1–6 grade band, for display only. */
export function pointsToGradeBand(points: number): number {
  if (points >= 13) return 1
  if (points >= 10) return 2
  if (points >= 7) return 3
  if (points >= 4) return 4
  if (points >= 1) return 5
  return 6
}

/** Secondary display only, e.g. "11 P. ≈ Note 2" — never the primary value for points_0_15. */
export function pointsToGradeLabel(points: number): string {
  const rounded = Math.round(points)
  return POINTS_TO_GRADE_LABEL[Math.min(15, Math.max(0, rounded))] ?? '–'
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean
  error?: string
}

/** Grade values are entered as whole numbers within the scale's bounds — no 0/7 on grade_1_6, no decimals. */
export function validateGradeValue(value: number, scale: GradingScale): ValidationResult {
  if (!Number.isFinite(value)) {
    return { valid: false, error: 'Bitte gib eine gültige Zahl ein.' }
  }
  if (!Number.isInteger(value)) {
    return { valid: false, error: 'Einzelne Werte müssen ganze Zahlen sein.' }
  }
  const { min, max } = gradeValueBounds(scale)
  if (value < min || value > max) {
    return { valid: false, error: `Werte müssen zwischen ${min} und ${max} liegen.` }
  }
  return { valid: true }
}

/** Category-level weighting (relative, e.g. 2 vs 1, or 50 vs 30 vs 20) — must not be negative. */
export function validateCategoryWeight(weight: number): ValidationResult {
  if (!Number.isFinite(weight) || weight < 0) {
    return { valid: false, error: 'Die Gewichtung darf nicht negativ sein.' }
  }
  return { valid: true }
}

/** Individual entry multiplicity (e.g. "2x") — must be a positive number. */
export function validateEntryWeight(weight: number): ValidationResult {
  if (!Number.isFinite(weight) || weight <= 0) {
    return { valid: false, error: 'Die Gewichtung muss größer als 0 sein.' }
  }
  return { valid: true }
}

// ---------------------------------------------------------------------------
// Averaging core
// ---------------------------------------------------------------------------

export interface WeightedInput {
  value: number
  weight: number
}

/** Weighted average; falls back to a plain mean when all weights are zero (e.g. all-0 category weights). */
export function calculateWeightedAverage(entries: WeightedInput[]): number | null {
  if (entries.length === 0) return null
  const totalWeight = entries.reduce((sum, e) => sum + e.weight, 0)
  if (totalWeight <= 0) {
    return entries.reduce((sum, e) => sum + e.value, 0) / entries.length
  }
  return entries.reduce((sum, e) => sum + e.value * e.weight, 0) / totalWeight
}

/**
 * Result of any averaging step. `value`/`scale` are both null whenever
 * there's nothing to show yet (no entries) OR the inputs mixed incompatible
 * scales — those two "empty" cases are told apart by `mixedScales`.
 */
export interface AverageResult {
  value: number | null
  scale: GradingScale | null
  mixedScales: boolean
}

export const EMPTY_AVERAGE: AverageResult = { value: null, scale: null, mixedScales: false }

export interface ScaledEntry {
  value: number
  weight: number
  scale: GradingScale
}

/**
 * categoryAverage = Σ(value × weight) / Σ(weight) over one category's grade entries.
 * Refuses to compute a number across entries recorded under different scales
 * (can happen if the profile's grading scale was changed after entries existed).
 */
export function categoryAverage(entries: ScaledEntry[]): AverageResult {
  if (entries.length === 0) return EMPTY_AVERAGE

  const scales = new Set(entries.map((e) => e.scale))
  if (scales.size > 1) {
    return { value: null, scale: null, mixedScales: true }
  }

  const value = calculateWeightedAverage(entries.map((e) => ({ value: e.value, weight: e.weight })))
  return { value, scale: entries[0].scale, mixedScales: false }
}

interface WeightedResult {
  result: AverageResult
  weight: number
}

/**
 * Shared core for subjectAverage (categories -> subject) and overallAverage
 * (subjects -> whole school): weighted-average the child results, but only
 * over children that (a) actually have a value and (b) agree on scale.
 * Empty children are skipped rather than dragging the average down; any
 * child that is itself mixed-scale — or children that disagree with each
 * other's scale — makes the *whole* result mixed rather than a silent guess.
 */
function combineWeightedResults(items: WeightedResult[]): AverageResult {
  const anyChildMixed = items.some((i) => i.result.mixedScales)

  const usable = items.filter(
    (i): i is WeightedResult & { result: { value: number; scale: GradingScale } } =>
      !i.result.mixedScales && i.result.value !== null && i.result.scale !== null,
  )

  if (usable.length === 0) {
    return { value: null, scale: null, mixedScales: anyChildMixed }
  }

  const scales = new Set(usable.map((i) => i.result.scale))
  const scaleConflict = scales.size > 1

  // Any scale conflict anywhere in the tree — a mixed child, or usable
  // children disagreeing with each other — means no honest number exists
  // at this level either. Never compute a value alongside mixedScales: true.
  if (anyChildMixed || scaleConflict) {
    return { value: null, scale: null, mixedScales: true }
  }

  const value = calculateWeightedAverage(usable.map((i) => ({ value: i.result.value, weight: i.weight })))
  return { value, scale: usable[0].result.scale, mixedScales: false }
}

export interface WeightedCategoryAverage {
  average: AverageResult
  /** The category's own relative weight (AssessmentCategory.weight). Disabled categories should be filtered out before calling. */
  weight: number
}

/**
 * subjectAverage = Σ(categoryAverage × categoryWeight) / Σ(categoryWeight),
 * over categories that actually have grades. Empty categories are excluded
 * entirely so they can't artificially drag the subject average down.
 */
export function subjectAverage(categories: WeightedCategoryAverage[]): AverageResult {
  return combineWeightedResults(categories.map((c) => ({ result: c.average, weight: c.weight })))
}

export interface WeightedSubjectAverage {
  average: AverageResult
  /** Relative subject weight; defaults to 1 for every subject until per-subject weighting exists. */
  weight: number
}

/**
 * overallAverage = weighted average of subject averages. Subjects without
 * grades yet are excluded. If the active subjects span more than one
 * grading scale, no single number can represent them honestly — the result
 * comes back as mixedScales instead of a misleading average.
 */
export function overallAverage(subjects: WeightedSubjectAverage[]): AverageResult {
  return combineWeightedResults(subjects.map((s) => ({ result: s.average, weight: s.weight })))
}

// ---------------------------------------------------------------------------
// Performance score & color tiers (UI-facing, scale-independent 0–100)
// ---------------------------------------------------------------------------

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score))
}

/**
 * Normalizes any grade value onto a 0–100 "how good is this" scale so charts,
 * bars and colors can work identically regardless of grading system. This is
 * NOT a grade and must never be displayed as one.
 */
export function performanceScore(value: number, scale: GradingScale): number {
  if (scale === 'points_0_15') {
    return clampScore((value / 15) * 100)
  }
  return clampScore(((6 - value) / 5) * 100)
}

export function performanceTierFromScore(score: number): PerformanceTier {
  if (score >= 85) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'medium'
  if (score >= 30) return 'warning'
  return 'critical'
}

export function performanceTier(value: number, scale: GradingScale): PerformanceTier {
  return performanceTierFromScore(performanceScore(value, scale))
}

/** Central color lookup — components read this instead of computing their own colors. */
export function performanceColorVar(tier: PerformanceTier): string {
  return `var(--color-perf-${tier})`
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Formats a number the German way, e.g. 1.75 -> "1,75". */
export function formatNumberDe(value: number, decimals: number): string {
  return value.toLocaleString('de-DE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** Formats a value for display according to its grading scale. */
export function formatGradeValue(value: number, scale: GradingScale): string {
  if (scale === 'points_0_15') {
    const isWhole = Number.isInteger(value)
    return `${formatNumberDe(value, isWhole ? 0 : 1)} P.`
  }
  return formatNumberDe(value, 2)
}

/** How a new hypothetical entry would move the current average, in scale units. */
export function simulateNewEntry(
  currentEntries: WeightedInput[],
  newEntry: WeightedInput,
): { before: number | null; after: number | null; delta: number | null } {
  const before = calculateWeightedAverage(currentEntries)
  const after = calculateWeightedAverage([...currentEntries, newEntry])
  const delta = before !== null && after !== null ? after - before : null
  return { before, after, delta }
}
