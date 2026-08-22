import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHalfYearOverview, type HalfYearOverviewRow } from '../../services/abiCalculatorService'
import { performanceScore } from '../../domain/grading'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { Card } from '../../components/ui/Card'
import { ScoreCircle } from '../../components/ui/ScoreCircle'
import { useGradeDataVersion } from '../grades/gradeDataVersion'

/**
 * One row per Block-I subject, one small ScoreCircle per Ausbildungsabschnitt
 * — deliberately never a gradient bar: the point is to see each
 * Halbjahresnote as its own discrete value, not a position on a scale.
 * Always a single vertical list, never a multi-column grid.
 */
export function AbiHalfYearOverview() {
  const navigate = useNavigate()
  const { version } = useGradeDataVersion()
  const [rows, setRows] = useState<HalfYearOverviewRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getHalfYearOverview().then((r) => {
      if (!active) return
      setRows(r)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [version])

  if (loading || rows.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-soft">Halbjahresleistungen</p>
      <div className="space-y-2">
        {rows.map((row) => (
          <Card
            key={row.subjectId}
            interactive
            onClick={() => navigate(`/app/subjects/${row.subjectId}`)}
            className="flex items-center gap-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-raised text-ink-soft">
              <SubjectIcon iconKey={row.subjectIcon} className="h-4.5 w-4.5" />
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{row.subjectName}</p>
            <div className="flex shrink-0 items-center gap-1.5">
              {row.cells.map((cell) =>
                cell.points !== null ? (
                  <ScoreCircle
                    key={cell.semesterName}
                    size="sm"
                    value={cell.points}
                    scale="points_0_15"
                    score={performanceScore(cell.points, 'points_0_15')}
                    hideUnit
                  />
                ) : (
                  <span
                    key={cell.semesterName}
                    aria-label={`${cell.semesterName}: noch keine Note`}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border-strong text-xs text-ink-faint"
                  >
                    –
                  </span>
                ),
              )}
            </div>
          </Card>
        ))}
      </div>
      <p className="text-center text-xs text-ink-faint">
        Tipp: Tippe auf ein Fach, um eine fehlende Halbjahresnote einzutragen.
      </p>
    </div>
  )
}
