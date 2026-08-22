import { useEffect, useState } from 'react'
import type { AbiCalculationResult, ProjectionMode, StateRuleConfig } from '../../domain/abi/types'
import {
  collectExamGrid,
  collectFullHalfYearGrid,
  loadAbiContext,
  type ExamGridCell,
  type HalfYearGridCell,
} from '../../services/abiCalculatorService'
import { calculateAbiProjection, type ProjectionOverrides } from '../../services/abiProjectionService'
import { Sheet } from '../../components/ui/Sheet'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { formatNumberDe } from '../../domain/grading'

interface AbiSimulatorSheetProps {
  open: boolean
  onClose: () => void
  config: StateRuleConfig
  /** The real, unassumed status — the simulation's comparison baseline. */
  current: AbiCalculationResult | null
}

const MODE_OPTIONS: { value: ProjectionMode; label: string }[] = [
  { value: 'manual', label: 'Eigene Annahmen' },
  { value: 'currentAverage', label: 'Aktueller Schnitt' },
  { value: 'trend', label: 'Trend' },
]

function overrideKey(subjectId: string, semesterName: string): string {
  return `${subjectId}::${semesterName}`
}

/**
 * Ephemeral only — nothing typed here is ever written to the AbiProfile.
 * Closing or reopening this sheet resets every assumption; only the real
 * result screens (AbiDashboardPage) show recorded data.
 */
export function AbiSimulatorSheet({ open, onClose, config, current }: AbiSimulatorSheetProps) {
  const [mode, setMode] = useState<ProjectionMode>('currentAverage')
  const [missingHalfYears, setMissingHalfYears] = useState<HalfYearGridCell[]>([])
  const [missingExams, setMissingExams] = useState<ExamGridCell[]>([])
  const [halfYearOverrides, setHalfYearOverrides] = useState<Record<string, number>>({})
  const [examOverrides, setExamOverrides] = useState<Record<string, number>>({})
  const [simulation, setSimulation] = useState<AbiCalculationResult | null>(null)

  useEffect(() => {
    if (!open) return
    setMode('currentAverage')
    setHalfYearOverrides({})
    setExamOverrides({})
    loadAbiContext().then(async (context) => {
      if (!context) return
      const [grid, examGrid] = await Promise.all([collectFullHalfYearGrid(context), Promise.resolve(collectExamGrid(context))])
      setMissingHalfYears(grid.filter((c) => c.points === null))
      setMissingExams(examGrid.filter((c) => c.points === null))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const overrides: ProjectionOverrides = { halfYearPoints: halfYearOverrides, examPoints: examOverrides }
    calculateAbiProjection(mode, overrides).then(setSimulation)
  }, [open, mode, halfYearOverrides, examOverrides])

  const currentTotal = current?.totalPoints.completed ?? null
  const simulatedTotal = simulation?.totalPoints.completed ?? null
  const delta = currentTotal !== null && simulatedTotal !== null ? simulatedTotal - currentTotal : null

  return (
    <Sheet open={open} onClose={onClose} title="Abitur simulieren">
      <div className="space-y-5">
        <SegmentedControl value={mode} onChange={setMode} options={MODE_OPTIONS} aria-label="Prognose-Modus" />

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-ink-faint">Aktuell</p>
            <p className="text-lg font-bold tabular-nums text-ink">{currentTotal ?? '–'} P.</p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Simulation</p>
            <p className="text-lg font-bold tabular-nums text-ink">{simulatedTotal ?? '–'} P.</p>
          </div>
          <div>
            <p className="text-xs text-ink-faint">Differenz</p>
            <p
              className={
                'text-lg font-bold tabular-nums ' +
                (delta === null ? 'text-ink-faint' : delta > 0 ? 'text-perf-excellent' : delta < 0 ? 'text-perf-warning' : 'text-ink')
              }
            >
              {delta !== null ? `${delta > 0 ? '+' : ''}${formatNumberDe(delta, 0)}` : '–'}
            </p>
          </div>
        </div>

        {mode === 'manual' && (missingHalfYears.length > 0 || missingExams.length > 0) && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink-soft">Noch offene Ergebnisse</p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {missingHalfYears.map((cell) => {
                const key = overrideKey(cell.subjectId, cell.semesterName)
                return (
                  <div key={key} className="flex items-center gap-2 rounded-control border border-border bg-bg-raised p-2.5">
                    <p className="min-w-0 flex-1 truncate text-sm text-ink">
                      {cell.subjectName} <span className="text-ink-faint">· {cell.semesterName}</span>
                    </p>
                    <input
                      type="number"
                      min={0}
                      max={15}
                      value={halfYearOverrides[key] ?? ''}
                      onChange={(e) =>
                        setHalfYearOverrides((prev) => ({ ...prev, [key]: Math.min(15, Math.max(0, Number(e.target.value))) }))
                      }
                      placeholder="P."
                      className="h-9 w-16 rounded-control border border-border bg-bg-card px-2 text-center text-sm text-ink outline-none focus:border-mint"
                    />
                  </div>
                )
              })}
              {missingExams.map((cell) => (
                <div key={cell.subjectId} className="flex items-center gap-2 rounded-control border border-border bg-bg-raised p-2.5">
                  <p className="min-w-0 flex-1 truncate text-sm text-ink">
                    {cell.subjectLabel} <span className="text-ink-faint">· Prüfung</span>
                  </p>
                  <input
                    type="number"
                    min={0}
                    max={15}
                    value={examOverrides[cell.subjectId] ?? ''}
                    onChange={(e) =>
                      setExamOverrides((prev) => ({ ...prev, [cell.subjectId]: Math.min(15, Math.max(0, Number(e.target.value))) }))
                    }
                    placeholder="P."
                    className="h-9 w-16 rounded-control border border-border bg-bg-card px-2 text-center text-sm text-ink outline-none focus:border-mint"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-ink-faint">
          Diese Simulation wird nicht gespeichert — sie dient nur der Ansicht hier. {config.ruleVersion}.
        </p>
      </div>
    </Sheet>
  )
}
