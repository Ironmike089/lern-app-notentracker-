import { calculateAbiResult, calculateBlockI, calculateBlockII } from '../domain/abi/calculator'
import type { AbiCalculationResult, ProjectionMode } from '../domain/abi/types'
import { collectExamGrid, collectFullHalfYearGrid, loadAbiContext } from './abiCalculatorService'

/**
 * Turns the honest "current status" into a labeled "Abi-Prognose" by filling
 * gaps with assumed values — never silently, always counted and disclosed
 * via assumptions[]/predictedResultsCount. Three modes (see docs section on
 * the Abi simulator): 'manual' uses only what the caller supplies via
 * overrides (nothing auto-filled beyond that), 'currentAverage' fills gaps
 * with the subject's own already-recorded average, 'trend' nudges that
 * average by the subject's own observed direction. Both B and C only ever
 * reuse the student's real numbers — nothing invented out of thin air.
 */

export interface ProjectionOverrides {
  /** Keyed as `${subjectId}::${semesterName}`. */
  halfYearPoints?: Record<string, number>
  /** Keyed by exam subjectId. */
  examPoints?: Record<string, number>
}

function clampPoints(value: number): number {
  return Math.min(15, Math.max(0, value))
}

function subjectAverageAcrossKnown(grid: { subjectId: string; points: number | null }[], subjectId: string): number | null {
  const known = grid.filter((c) => c.subjectId === subjectId && c.points !== null).map((c) => c.points as number)
  if (known.length === 0) return null
  return known.reduce((sum, v) => sum + v, 0) / known.length
}

/** Simple, honest trend nudge: half the gap between the subject's first and last known result, applied to its own average. */
function subjectTrendAdjustedAverage(
  gridInOrder: { subjectId: string; semesterName: string; points: number | null }[],
  subjectId: string,
): number | null {
  const known = gridInOrder.filter((c) => c.subjectId === subjectId && c.points !== null)
  const average = subjectAverageAcrossKnown(gridInOrder, subjectId)
  if (average === null || known.length < 2) return average
  const first = known[0].points as number
  const last = known[known.length - 1].points as number
  return clampPoints(average + (last - first) / 2)
}

export async function calculateAbiProjection(
  mode: ProjectionMode,
  overrides: ProjectionOverrides = {},
): Promise<AbiCalculationResult | null> {
  const context = await loadAbiContext()
  if (!context) return null

  const grid = await collectFullHalfYearGrid(context)
  const examGrid = collectExamGrid(context)
  const assumptions: string[] = []
  let predictedCount = 0

  const halfYearResults = grid.map((cell) => {
    if (cell.points !== null) return { semesterName: cell.semesterName, points: cell.points }

    const overrideKey = `${cell.subjectId}::${cell.semesterName}`
    const manualValue = overrides.halfYearPoints?.[overrideKey]
    if (manualValue !== undefined) {
      predictedCount++
      assumptions.push(`${cell.subjectName} (${cell.semesterName}): ${clampPoints(manualValue)} P. — eigene Annahme.`)
      return { semesterName: cell.semesterName, points: clampPoints(manualValue) }
    }

    if (mode === 'manual') return { semesterName: cell.semesterName, points: null }

    const assumed =
      mode === 'trend' ? subjectTrendAdjustedAverage(grid, cell.subjectId) : subjectAverageAcrossKnown(grid, cell.subjectId)
    if (assumed === null) return { semesterName: cell.semesterName, points: null }

    predictedCount++
    assumptions.push(
      `${cell.subjectName} (${cell.semesterName}): ${assumed.toFixed(1)} P. — ${
        mode === 'trend' ? 'Trendprognose' : 'bisheriger Fachdurchschnitt'
      }.`,
    )
    return { semesterName: cell.semesterName, points: assumed }
  })

  const examResults = examGrid.map((cell) => {
    if (cell.points !== null) return { subjectLabel: cell.subjectLabel, points: cell.points }

    const manualValue = overrides.examPoints?.[cell.subjectId]
    if (manualValue !== undefined) {
      predictedCount++
      assumptions.push(`${cell.subjectLabel} (Prüfung): ${clampPoints(manualValue)} P. — eigene Annahme.`)
      return { subjectLabel: cell.subjectLabel, points: clampPoints(manualValue) }
    }

    if (mode === 'manual') return { subjectLabel: cell.subjectLabel, points: null }

    const assumed = subjectAverageAcrossKnown(grid, cell.subjectId)
    if (assumed === null) return { subjectLabel: cell.subjectLabel, points: null }

    predictedCount++
    assumptions.push(
      `${cell.subjectLabel} (Prüfung): ${assumed.toFixed(1)} P. — ${
        mode === 'trend' ? 'Trendprognose (auf Basis des bisherigen Fachdurchschnitts)' : 'bisheriger Fachdurchschnitt'
      }.`,
    )
    return { subjectLabel: cell.subjectLabel, points: assumed }
  })

  const blockI = calculateBlockI(context.config, halfYearResults)
  const blockII = calculateBlockII(context.config, examResults)
  const knownCount = grid.filter((c) => c.points !== null).length + examGrid.filter((c) => c.points !== null).length

  return calculateAbiResult({
    config: context.config,
    blockI,
    blockII,
    knownResultsCount: knownCount,
    predictedResultsCount: predictedCount,
    warnings:
      predictedCount === 0
        ? []
        : [`Diese Prognose enthält ${predictedCount} angenommene(s) von ${knownCount + predictedCount} Ergebnis(sen) — sie ist keine offizielle Berechnung.`],
    assumptions,
  })
}
