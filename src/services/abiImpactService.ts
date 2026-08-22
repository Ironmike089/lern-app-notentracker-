import { calculateAbiProjection } from './abiProjectionService'
import { collectFullHalfYearGrid, loadAbiContext } from './abiCalculatorService'

/**
 * "Auswirkung auf Abi-Prognose" — for each subject that still has an open
 * Ausbildungsabschnitt, shows what a plausible next result (its own current
 * average, one point better) would do to the total-points prognosis. Reuses
 * the same 'currentAverage' projection the Abi dashboard already shows as
 * its baseline, so this is never a second, diverging calculation — just the
 * same one with a single cell nudged.
 */

export interface AbiImpactRow {
  subjectId: string
  subjectName: string
  currentAverage: number
  nextSemesterName: string
  assumedNextPoints: number
  baselineTotalPoints: number
  projectedTotalPoints: number
}

function clampPoints(value: number): number {
  return Math.min(15, Math.max(0, value))
}

export async function calculateAbiImpactPerSubject(): Promise<AbiImpactRow[]> {
  const context = await loadAbiContext()
  if (!context) return []

  const grid = await collectFullHalfYearGrid(context)
  const baseline = await calculateAbiProjection('currentAverage')
  if (!baseline) return []

  const subjectIds = [...new Set(grid.map((c) => c.subjectId))]
  const rows: AbiImpactRow[] = []

  for (const subjectId of subjectIds) {
    const cellsForSubject = grid.filter((c) => c.subjectId === subjectId)
    const known = cellsForSubject.filter((c) => c.points !== null)
    const nextCell = cellsForSubject.find((c) => c.points === null)
    if (known.length === 0 || !nextCell) continue

    const currentAverage = known.reduce((sum, c) => sum + (c.points as number), 0) / known.length
    const assumedNextPoints = clampPoints(Math.round(currentAverage) + 1)
    const overrideKey = `${subjectId}::${nextCell.semesterName}`

    const projection = await calculateAbiProjection('currentAverage', { halfYearPoints: { [overrideKey]: assumedNextPoints } })
    if (!projection) continue

    rows.push({
      subjectId,
      subjectName: nextCell.subjectName,
      currentAverage,
      nextSemesterName: nextCell.semesterName,
      assumedNextPoints,
      baselineTotalPoints: baseline.totalPoints.completed,
      projectedTotalPoints: projection.totalPoints.completed,
    })
  }

  return rows
}
