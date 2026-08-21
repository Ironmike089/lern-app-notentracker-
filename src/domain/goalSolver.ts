import { gradeValueBounds, isHigherBetter, type AverageResult } from './grading'
import type { GradingScale } from './types'

/**
 * "Was brauche ich?" — inverts the same weighted-average math the engine
 * already uses (categoryAverage -> subjectAverage), solving for the raw
 * value a hypothetical next entry in one category would need to be for the
 * subject average to reach a target. Pure, no I/O — the DB-facing wrapper
 * lives in gradeStatsService.ts.
 */

export interface OtherCategoryInput {
  weight: number
  average: AverageResult
}

export interface TargetCategoryInput {
  weight: number
  entries: { value: number; weight: number }[]
}

export type GoalSolverOutcome =
  /** The target category currently carries no influence on the subject average (weight 0, while others carry weight) — no value entered there can move it. */
  | { kind: 'no-influence' }
  /** No value on the scale is good enough — the goal is out of reach with a single entry here. */
  | { kind: 'unreachable'; exactValue: number }
  /** Any valid value already satisfies the goal — even the worst possible grade keeps you there. */
  | { kind: 'already-guaranteed'; exactValue: number }
  /** A concrete value (rounded to the scale's integer grid) would reach the goal. */
  | { kind: 'achievable'; requiredValue: number; exactValue: number }

function sumWeighted(entries: { value: number; weight: number }[]): { weightedSum: number; totalWeight: number } {
  return entries.reduce(
    (acc, e) => ({ weightedSum: acc.weightedSum + e.value * e.weight, totalWeight: acc.totalWeight + e.weight }),
    { weightedSum: 0, totalWeight: 0 },
  )
}

/**
 * Solves for the category average the target category would need after adding
 * one more entry, given all other (already-computed) category averages and
 * weights, so that the resulting subjectAverage equals `targetSubjectAverage`.
 *
 * Mirrors combineWeightedResults' own fallback: when every usable category's
 * weight (including the target's) is 0, it's a plain mean instead of a
 * weighted one — solving must use the same rule the real engine would use,
 * or the answer would be wrong.
 */
function solveRequiredCategoryAverage(
  otherCategories: OtherCategoryInput[],
  targetWeight: number,
  targetSubjectAverage: number,
): number | null {
  const usableOthers = otherCategories.filter((c) => c.average.value !== null && !c.average.mixedScales)
  const totalWeight = usableOthers.reduce((sum, c) => sum + c.weight, 0) + targetWeight

  if (totalWeight > 0) {
    if (targetWeight <= 0) return null // this category has no share of a nonzero total weight — can't be solved for
    const weightedSumOthers = usableOthers.reduce((sum, c) => sum + (c.average.value as number) * c.weight, 0)
    return (targetSubjectAverage * totalWeight - weightedSumOthers) / targetWeight
  }

  // Every usable category (including the target) is zero-weighted -> plain mean fallback.
  const sumOthers = usableOthers.reduce((sum, c) => sum + (c.average.value as number), 0)
  const count = usableOthers.length + 1
  return targetSubjectAverage * count - sumOthers
}

export function solveRequiredValue(
  otherCategories: OtherCategoryInput[],
  targetCategory: TargetCategoryInput,
  targetSubjectAverage: number,
  scale: GradingScale,
  newEntryWeight = 1,
): GoalSolverOutcome {
  if (!Number.isFinite(newEntryWeight) || newEntryWeight <= 0) {
    return { kind: 'no-influence' }
  }

  const requiredCategoryAverage = solveRequiredCategoryAverage(
    otherCategories,
    targetCategory.weight,
    targetSubjectAverage,
  )
  if (requiredCategoryAverage === null || !Number.isFinite(requiredCategoryAverage)) {
    return { kind: 'no-influence' }
  }

  const { weightedSum, totalWeight } = sumWeighted(targetCategory.entries)
  const combinedWeight = totalWeight + newEntryWeight
  // combinedWeight > 0 always holds here since newEntryWeight > 0 was checked above.
  const exactValue = (requiredCategoryAverage * combinedWeight - weightedSum) / newEntryWeight

  if (!Number.isFinite(exactValue)) return { kind: 'no-influence' }

  const { min, max } = gradeValueBounds(scale)
  const higherIsBetter = isHigherBetter(scale)

  const pastBestPossible = higherIsBetter ? exactValue > max : exactValue < min
  const pastWorstPossible = higherIsBetter ? exactValue < min : exactValue > max

  if (pastBestPossible) return { kind: 'unreachable', exactValue }
  if (pastWorstPossible) return { kind: 'already-guaranteed', exactValue }

  // "ungefähr" by design — the UI reports this as an approximate figure, so
  // round to the nearest achievable value rather than a conservative bound.
  const requiredValue = Math.min(max, Math.max(min, Math.round(exactValue)))
  return { kind: 'achievable', requiredValue, exactValue }
}
