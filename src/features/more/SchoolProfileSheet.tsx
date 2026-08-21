import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, MapPin, School, Sigma } from 'lucide-react'
import { GERMAN_STATES } from '../../domain/germanStates'
import { SCHOOL_TYPES } from '../../domain/schoolTypes'
import type { SchoolProfile } from '../../domain/types'
import { updateSchoolProfile } from '../../services/schoolProfileService'
import { Sheet } from '../../components/ui/Sheet'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { StateStep } from '../onboarding/StateStep'
import { SchoolTypeStep } from '../onboarding/SchoolTypeStep'
import { GradeLevelStep } from '../onboarding/GradeLevelStep'

type EditField = 'menu' | 'state' | 'schoolType' | 'gradeLevel'

interface SchoolProfileSheetProps {
  open: boolean
  onClose: () => void
  profile: SchoolProfile
  onChanged: () => void
}

function scaleLabel(profile: Pick<SchoolProfile, 'gradingScale'>): string {
  return profile.gradingScale === 'points_0_15' ? 'Punkte (0–15)' : 'Noten (1–6)'
}

/** SCHULE-Bearbeitung — reuses the onboarding step components verbatim rather than re-inventing pickers. */
export function SchoolProfileSheet({ open, onClose, profile, onChanged }: SchoolProfileSheetProps) {
  const { showToast } = useToast()
  const [field, setField] = useState<EditField>('menu')
  const [pendingScaleChange, setPendingScaleChange] = useState<{ gradeLevel: number; upperSecondary: boolean } | null>(
    null,
  )

  useEffect(() => {
    if (open) {
      setField('menu')
      setPendingScaleChange(null)
    }
  }, [open])

  const stateName = GERMAN_STATES.find((s) => s.code === profile.state)?.name ?? profile.state
  const schoolTypeName = SCHOOL_TYPES.find((t) => t.id === profile.schoolType)?.name ?? profile.schoolType

  async function apply(patch: Parameters<typeof updateSchoolProfile>[0], message: string) {
    await updateSchoolProfile(patch)
    onChanged()
    showToast(message, 'success')
    setField('menu')
  }

  if (field === 'state') {
    return (
      <Sheet open={open} onClose={onClose} title="Bundesland">
        <BackButton onClick={() => setField('menu')} />
        <StateStep value={profile.state} onNext={(state) => apply({ state }, 'Bundesland aktualisiert.')} />
      </Sheet>
    )
  }

  if (field === 'schoolType') {
    return (
      <Sheet open={open} onClose={onClose} title="Schulart">
        <BackButton onClick={() => setField('menu')} />
        <SchoolTypeStep
          value={profile.schoolType}
          onNext={(schoolType) => apply({ schoolType }, 'Schulart aktualisiert.')}
        />
      </Sheet>
    )
  }

  if (field === 'gradeLevel') {
    if (pendingScaleChange) {
      const nextScale = pendingScaleChange.upperSecondary ? 'points_0_15' : 'grade_1_6'
      const scaleActuallyChanges = nextScale !== profile.gradingScale
      return (
        <Sheet open={open} onClose={onClose} title="Bewertungssystem ändern?">
          <BackButton onClick={() => setPendingScaleChange(null)} />
          <div className="space-y-4">
            <p className="text-sm text-ink-soft">
              Klassenstufe {pendingScaleChange.gradeLevel} bedeutet: {pendingScaleChange.upperSecondary ? 'Punkte (0–15)' : 'Noten (1–6)'}.
              {scaleActuallyChanges && (
                <>
                  {' '}
                  Bereits gespeicherte Noten werden dabei <strong>nicht</strong> umgerechnet — sie bleiben im bisherigen
                  System gespeichert, neue Noten werden im neuen System erfasst.
                </>
              )}
            </p>
            <Button
              size="lg"
              className="w-full"
              onClick={() =>
                apply(
                  {
                    gradeLevel: pendingScaleChange.gradeLevel,
                    gradingScale: nextScale,
                    upperSecondary: pendingScaleChange.upperSecondary,
                  },
                  'Klassenstufe aktualisiert.',
                )
              }
            >
              Bestätigen
            </Button>
          </div>
        </Sheet>
      )
    }
    return (
      <Sheet open={open} onClose={onClose} title="Klassenstufe">
        <BackButton onClick={() => setField('menu')} />
        <GradeLevelStep
          schoolType={profile.schoolType}
          onNext={({ gradeLevel, upperSecondary }) => {
            const nextScale = upperSecondary ? 'points_0_15' : 'grade_1_6'
            if (nextScale !== profile.gradingScale || gradeLevel !== profile.gradeLevel) {
              setPendingScaleChange({ gradeLevel, upperSecondary })
            } else {
              apply({ gradeLevel, gradingScale: nextScale, upperSecondary }, 'Klassenstufe aktualisiert.')
            }
          }}
        />
      </Sheet>
    )
  }

  return (
    <Sheet open={open} onClose={onClose} title="Schule">
      <div className="flex flex-col gap-2">
        <MenuRow icon={<MapPin className="h-4 w-4" strokeWidth={1.75} />} label="Bundesland" value={stateName} onClick={() => setField('state')} />
        <MenuRow icon={<School className="h-4 w-4" strokeWidth={1.75} />} label="Schulart" value={schoolTypeName} onClick={() => setField('schoolType')} />
        <MenuRow
          icon={<Sigma className="h-4 w-4" strokeWidth={1.75} />}
          label="Klassenstufe & Bewertungssystem"
          value={`Klasse ${profile.gradeLevel} · ${scaleLabel(profile)}`}
          onClick={() => setField('gradeLevel')}
        />
      </div>
    </Sheet>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-4 inline-flex w-fit items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
    >
      <ChevronLeft className="h-4 w-4" strokeWidth={2} />
      Zurück
    </button>
  )
}

function MenuRow({
  icon,
  label,
  value,
  onClick,
}: {
  icon: ReactNode
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-control border border-border bg-bg-raised p-3.5 text-left transition-colors hover:border-border-strong hover:bg-bg-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-card text-ink-soft">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block truncate text-xs text-ink-faint">{value}</span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} />
    </button>
  )
}
