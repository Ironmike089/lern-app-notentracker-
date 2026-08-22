import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import type { StateRuleConfig } from '../../domain/abi/types'
import type { Subject } from '../../domain/types'
import { setAbiProfile, ensureSeminarSubject, getAbiProfile } from '../../services/abiProfileService'
import { subjectRepository } from '../../storage/repositories'
import { Sheet } from '../../components/ui/Sheet'
import { Button } from '../../components/ui/Button'
import { SelectableCard } from '../../components/ui/SelectableCard'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { useToast } from '../../components/ui/toastContext'

interface AbiSetupWizardProps {
  open: boolean
  onClose: () => void
  config: StateRuleConfig
  onCompleted: () => void
}

function currentDefaultGraduationYear(config: StateRuleConfig): number {
  return Math.max(config.graduationYearFrom, new Date().getFullYear() + 1)
}

function toggle(list: string[], id: string, max?: number): string[] {
  if (list.includes(id)) return list.filter((x) => x !== id)
  if (max !== undefined && list.length >= max) return list
  return [...list, id]
}

/**
 * A short, data-driven step wizard — the step sequence comes from
 * config.requiredSetupFields, not a hardcoded per-state if/else chain (see
 * domain/abi/types.ts). Bundesland/Schulart/Fächer are already set via the
 * regular onboarding + Fächerverwaltung; this only ever asks for what the
 * Abi module itself needs on top of that.
 */
export function AbiSetupWizard({ open, onClose, config, onCompleted }: AbiSetupWizardProps) {
  const { showToast } = useToast()
  const steps = config.requiredSetupFields
  const [stepIndex, setStepIndex] = useState(0)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [graduationYear, setGraduationYear] = useState(currentDefaultGraduationYear(config))
  const [performanceSubjectIds, setPerformanceSubjectIds] = useState<string[]>([])
  const [writtenExamSubjectIds, setWrittenExamSubjectIds] = useState<string[]>([])
  const [oralExamSubjectIds, setOralExamSubjectIds] = useState<string[]>([])
  const [seminarSubjectId, setSeminarSubjectId] = useState<string | undefined>()
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setStepIndex(0)
    subjectRepository.getAll().then((all) => {
      setSubjects(all.filter((s) => !s.archived && s.kind !== 'seminar'))
      setSeminarSubjectId(all.find((s) => s.kind === 'seminar')?.id)
    })
    getAbiProfile().then((existing) => {
      if (!existing) return
      setGraduationYear(existing.graduationYear)
      setPerformanceSubjectIds(existing.performanceSubjectIds)
      setWrittenExamSubjectIds(existing.writtenExamSubjectIds)
      setOralExamSubjectIds(existing.oralExamSubjectIds)
    })
  }, [open, config])

  const currentStep = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  async function goNext() {
    if (!isLastStep) {
      setStepIndex((i) => i + 1)
      return
    }
    setSaving(true)
    try {
      if (steps.includes('wSeminarSubject')) {
        await ensureSeminarSubject(seminarSubjectId, 'W-Seminar', 'notebook-pen')
      }
      await setAbiProfile({
        ruleVersion: config.ruleVersion,
        graduationYear,
        performanceSubjectIds,
        writtenExamSubjectIds,
        oralExamSubjectIds,
      })
      showToast('Abitur-Modul eingerichtet.', 'success')
      onCompleted()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  function canProceed(): boolean {
    if (currentStep === 'graduationYear') return graduationYear >= new Date().getFullYear()
    if (currentStep === 'performanceSubject') return performanceSubjectIds.length > 0
    if (currentStep === 'writtenExamSubjects') return writtenExamSubjectIds.length === config.examBlock.writtenExamCount
    if (currentStep === 'oralExamSubjects') return oralExamSubjectIds.length === config.examBlock.oralExamCount
    return true
  }

  const title = 'Abitur einrichten'

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {stepIndex > 0 && (
        <button
          type="button"
          onClick={() => setStepIndex((i) => i - 1)}
          className="mb-4 inline-flex w-fit items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Zurück
        </button>
      )}

      <p className="mb-3 text-xs font-medium text-ink-faint">
        Schritt {stepIndex + 1} von {steps.length}
      </p>

      {currentStep === 'graduationYear' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink">In welchem Jahr machst du voraussichtlich Abitur?</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Das legt fest, welche Regelversion für dich gilt ({config.ruleVersion}).
            </p>
          </div>
          <input
            type="number"
            value={graduationYear}
            onChange={(e) => setGraduationYear(Number(e.target.value))}
            className="h-12 w-full rounded-control border border-border bg-bg-raised px-3.5 text-lg font-semibold text-ink outline-none transition-colors focus:border-mint"
          />
        </div>
      )}

      {currentStep === 'performanceSubject' && (
        <SubjectPicker
          title="Welches ist dein Leistungsfach?"
          subjects={subjects}
          selected={performanceSubjectIds}
          onToggle={(id) => setPerformanceSubjectIds((prev) => toggle(prev, id))}
        />
      )}

      {currentStep === 'writtenExamSubjects' && (
        <SubjectPicker
          title={`Wähle ${config.examBlock.writtenExamCount} schriftliche Prüfungsfächer`}
          subjects={subjects}
          selected={writtenExamSubjectIds}
          onToggle={(id) => setWrittenExamSubjectIds((prev) => toggle(prev, id, config.examBlock.writtenExamCount))}
          counter={`${writtenExamSubjectIds.length} / ${config.examBlock.writtenExamCount} ausgewählt`}
        />
      )}

      {currentStep === 'oralExamSubjects' && (
        <SubjectPicker
          title={`Wähle ${config.examBlock.oralExamCount} mündliche Prüfungsfächer`}
          subjects={subjects.filter((s) => !writtenExamSubjectIds.includes(s.id))}
          selected={oralExamSubjectIds}
          onToggle={(id) => setOralExamSubjectIds((prev) => toggle(prev, id, config.examBlock.oralExamCount))}
          counter={`${oralExamSubjectIds.length} / ${config.examBlock.oralExamCount} ausgewählt`}
        />
      )}

      {currentStep === 'wSeminarSubject' && (
        <div className="space-y-3">
          <div>
            <h3 className="text-base font-semibold text-ink">W-Seminar</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Wir legen ein eigenes W-Seminar-Modul für dich an — es wird nicht wie ein normales Fach gemittelt.
            </p>
          </div>
          <SelectableCard selected disabled title="W-Seminar" subtitle="Seminararbeit + Präsentation, eigene Bewertung" />
        </div>
      )}

      <Button size="lg" className="mt-6 w-full" onClick={goNext} disabled={!canProceed() || saving}>
        {isLastStep ? (saving ? 'Speichert…' : 'Fertig') : 'Weiter'}
      </Button>
    </Sheet>
  )
}

function SubjectPicker({
  title,
  subjects,
  selected,
  onToggle,
  counter,
}: {
  title: string
  subjects: Subject[]
  selected: string[]
  onToggle: (id: string) => void
  counter?: string
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {counter && <p className="mt-1 text-sm text-ink-soft">{counter}</p>}
      </div>
      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
        {subjects.map((subject) => (
          <SelectableCard
            key={subject.id}
            selected={selected.includes(subject.id)}
            title={subject.name}
            icon={<SubjectIcon iconKey={subject.icon} className="h-4.5 w-4.5" />}
            onClick={() => onToggle(subject.id)}
          />
        ))}
      </div>
    </div>
  )
}
