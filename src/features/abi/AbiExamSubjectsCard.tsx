import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getExamSubjectsOverview, type ExamSubjectOverviewRow } from '../../services/abiCalculatorService'
import { setExamPoints, setExamSubjectRole } from '../../services/abiProfileService'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { Card } from '../../components/ui/Card'
import { cn } from '../../utils/cn'
import { useGradeDataVersion } from '../grades/gradeDataVersion'

type ExamRole = ExamSubjectOverviewRow['role']

function RoleToggle({ role, onChange }: { role: ExamRole; onChange: (role: ExamRole) => void }) {
  return (
    <div className="inline-flex shrink-0 overflow-hidden rounded-control border border-border" role="group" aria-label="Prüfungsart">
      {(['schriftlich', 'mündlich'] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={role === option}
          onClick={() => onChange(option)}
          className={cn(
            'flex h-8 w-8 items-center justify-center text-xs font-bold transition-colors',
            role === option ? 'bg-mint text-[#06140f]' : 'bg-bg-raised text-ink-faint hover:text-ink-soft',
          )}
        >
          {option === 'schriftlich' ? 'S' : 'M'}
        </button>
      ))}
    </div>
  )
}

/**
 * Shows exactly which subjects are set up as Abitur-Prüfungsfächer (from the
 * setup wizard, otherwise invisible after the wizard closes), and lets the
 * student actually enter each subject's real Abiturprüfung result. Without
 * this, Block II (examPoints) has no UI path at all — setExamPoints existed
 * but was never called from anywhere, so entering results here previously
 * had no effect on the calculation. The S/M toggle re-labels an already-
 * chosen subject as written/oral without reopening the setup wizard — the
 * calculator scores both identically, so this never changes any result.
 */
export function AbiExamSubjectsCard() {
  const navigate = useNavigate()
  const { version, bumpVersion } = useGradeDataVersion()
  const [rows, setRows] = useState<ExamSubjectOverviewRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getExamSubjectsOverview().then((r) => {
      if (!active) return
      setRows(r)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [version])

  async function handlePointsChange(subjectId: string, raw: string) {
    const points = raw === '' ? null : Math.min(15, Math.max(0, Number(raw)))
    setRows((prev) => prev.map((r) => (r.subjectId === subjectId ? { ...r, points } : r)))
    await setExamPoints(subjectId, points)
    bumpVersion()
  }

  async function handleRoleChange(subjectId: string, role: ExamRole) {
    setRows((prev) => prev.map((r) => (r.subjectId === subjectId ? { ...r, role } : r)))
    await setExamSubjectRole(subjectId, role)
    bumpVersion()
  }

  if (loading || rows.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-soft">Abiturprüfungen</p>
      <Card className="divide-y divide-border">
        {rows.map((row) => (
          <div key={row.subjectId} className="space-y-2 py-3 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/subjects/${row.subjectId}`)}
              className="flex w-full min-w-0 items-center gap-2.5 text-left"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-raised text-ink-soft">
                <SubjectIcon iconKey={row.subjectIcon} className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{row.subjectName}</p>
                {row.isPerformanceSubject && <p className="text-xs text-ink-faint">Leistungsfach</p>}
              </div>
            </button>
            <div className="flex items-center justify-between gap-3 pl-[42px]">
              <RoleToggle role={row.role} onChange={(role) => handleRoleChange(row.subjectId, role)} />
              <input
                type="number"
                min={0}
                max={15}
                value={row.points ?? ''}
                onChange={(e) => handlePointsChange(row.subjectId, e.target.value)}
                placeholder="– P."
                aria-label={`Prüfungsergebnis ${row.subjectName}`}
                className="h-10 w-16 shrink-0 rounded-control border border-border bg-bg-raised px-2 text-center text-sm font-semibold text-ink outline-none transition-colors focus:border-mint"
              />
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}
