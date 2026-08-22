import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Info } from 'lucide-react'
import type { Subject } from '../../domain/types'
import { calculateBavariaSeminarScore } from '../../domain/abi/states/byCalculator'
import { getSeminarAssessment, setSeminarPoints } from '../../services/seminarAssessmentService'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { Card } from '../../components/ui/Card'
import { useGradeDataVersion } from '../grades/gradeDataVersion'

function PointsField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink">{label}</span>
      <input
        type="number"
        min={0}
        max={15}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Math.min(15, Math.max(0, Number(e.target.value))))}
        placeholder="– P."
        className="h-10 w-20 rounded-control border border-border bg-bg-raised px-2 text-center text-sm font-semibold text-ink outline-none transition-colors focus:border-mint"
      />
    </div>
  )
}

/**
 * A W-Seminar is never averaged like a normal subject (see
 * domain/abi/states/by.ts) — this replaces the whole Leistungen/Statistik/
 * Einstellungen tab structure with its own, much smaller screen.
 */
export function SeminarDetailPage({ subject }: { subject: Subject }) {
  const navigate = useNavigate()
  const { bumpVersion } = useGradeDataVersion()
  const [seminarPaperPoints, setSeminarPaperPoints] = useState<number | null>(null)
  const [presentationPoints, setPresentationPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSeminarAssessment(subject.id).then((assessment) => {
      setSeminarPaperPoints(assessment?.seminarPaperPoints ?? null)
      setPresentationPoints(assessment?.presentationPoints ?? null)
      setLoading(false)
    })
  }, [subject.id])

  async function save(next: { seminarPaperPoints: number | null; presentationPoints: number | null }) {
    await setSeminarPoints(subject.id, next.seminarPaperPoints, next.presentationPoints)
    bumpVersion()
  }

  const totalScore = calculateBavariaSeminarScore(seminarPaperPoints, presentationPoints)

  if (loading) return null

  return (
    <div className="mx-auto w-full max-w-md space-y-6 md:max-w-xl">
      <button
        type="button"
        onClick={() => navigate('/app/subjects')}
        className="flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        Fächer
      </button>

      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">
          <SubjectIcon iconKey={subject.icon} className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{subject.name}</p>
          <p className="text-3xl font-extrabold text-ink tabular-nums">
            {totalScore ?? '–'} <span className="text-lg font-semibold text-ink-faint">/ 30 P.</span>
          </p>
          <p className="text-xs text-ink-faint">Gesamtleistung W-Seminar</p>
        </div>
      </div>

      <Card className="flex items-start gap-2.5">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-violet" strokeWidth={2} />
        <p className="text-xs text-ink-soft">
          Läuft über 12/1, 12/2 und 13/1. Die kleinen Leistungsnachweise in 12/1 und 12/2 fließen in die
          Seminararbeit und Präsentation ein — die App verfolgt hier nur die beiden offiziell gesondert
          ausgewiesenen Endergebnisse, gewichtet 3:1 (siehe docs/abi-rules-audit.md).
        </p>
      </Card>

      <Card className="space-y-4">
        <PointsField
          label="Seminararbeit"
          value={seminarPaperPoints}
          onChange={(v) => {
            setSeminarPaperPoints(v)
            save({ seminarPaperPoints: v, presentationPoints })
          }}
        />
        <PointsField
          label="Präsentation / Prüfungsgespräch"
          value={presentationPoints}
          onChange={(v) => {
            setPresentationPoints(v)
            save({ seminarPaperPoints, presentationPoints: v })
          }}
        />
      </Card>
    </div>
  )
}
