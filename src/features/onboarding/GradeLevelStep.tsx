import { useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { SCHOOL_TYPES } from '../../domain/schoolTypes'
import type { GradingScale, SchoolType } from '../../domain/types'
import { SelectableCard } from '../../components/ui/SelectableCard'

interface GradeLevelResult {
  gradeLevel: number
  gradingScale: GradingScale
  upperSecondary: boolean
}

interface GradeLevelStepProps {
  schoolType: SchoolType
  onNext: (result: GradeLevelResult) => void
}

export function GradeLevelStep({ schoolType, onNext }: GradeLevelStepProps) {
  const info = SCHOOL_TYPES.find((t) => t.id === schoolType)!
  const [pendingGrade, setPendingGrade] = useState<number | null>(null)

  function chooseGrade(gradeLevel: number) {
    if (info.upperSecondaryLevels.includes(gradeLevel)) {
      setPendingGrade(gradeLevel)
      return
    }
    onNext({ gradeLevel, gradingScale: 'grade_1_6', upperSecondary: false })
  }

  if (pendingGrade !== null) {
    return (
      <div className="flex flex-1 flex-col gap-5 animate-fade-in">
        <button
          type="button"
          onClick={() => setPendingGrade(null)}
          className="inline-flex w-fit items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
          Andere Klassenstufe wählen
        </button>

        <div className="space-y-1">
          <h2 className="text-xl font-bold text-ink">Bist du bereits in der gymnasialen Oberstufe?</h2>
          <p className="text-sm text-ink-soft">
            Das entscheidet, ob wir mit Punkten (0–15) oder Schulnoten (1–6) rechnen.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <SelectableCard
            selected={false}
            title="Ja, ich bekomme 0–15 Punkte"
            onClick={() =>
              onNext({ gradeLevel: pendingGrade, gradingScale: 'points_0_15', upperSecondary: true })
            }
          />
          <SelectableCard
            selected={false}
            title="Nein, ich bekomme Noten von 1–6"
            onClick={() =>
              onNext({ gradeLevel: pendingGrade, gradingScale: 'grade_1_6', upperSecondary: false })
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-5 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">Welche Klassenstufe besuchst du?</h2>
        <p className="text-sm text-ink-soft">Wähle deine aktuelle Jahrgangsstufe.</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {info.gradeLevels.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => chooseGrade(level)}
            className="flex h-14 items-center justify-center rounded-control border border-border bg-bg-card text-base font-semibold text-ink transition-all duration-200 hover:border-border-strong hover:bg-bg-card-hover active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  )
}
