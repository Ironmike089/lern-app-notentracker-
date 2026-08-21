import { BookOpen, GraduationCap, Landmark } from 'lucide-react'
import { SCHOOL_TYPES } from '../../domain/schoolTypes'
import type { SchoolType } from '../../domain/types'
import { SelectableCard } from '../../components/ui/SelectableCard'

const SCHOOL_TYPE_ICONS: Record<SchoolType, typeof BookOpen> = {
  hauptschule: BookOpen,
  realschule: Landmark,
  gymnasium: GraduationCap,
}

interface SchoolTypeStepProps {
  value?: SchoolType
  onNext: (schoolType: SchoolType) => void
}

export function SchoolTypeStep({ value, onNext }: SchoolTypeStepProps) {
  return (
    <div className="flex flex-1 flex-col gap-5 animate-fade-in">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">Welche Schulart besuchst du?</h2>
        <p className="text-sm text-ink-soft">
          Einige Bundesländer haben abweichende oder integrierte Schulformen — die Auswahl steuert
          nur die Berechnung, keine offizielle Einstufung.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {SCHOOL_TYPES.map((type) => {
          const Icon = SCHOOL_TYPE_ICONS[type.id]
          return (
            <SelectableCard
              key={type.id}
              selected={value === type.id}
              title={type.name}
              subtitle={type.description}
              icon={<Icon className="h-5 w-5" strokeWidth={1.75} />}
              onClick={() => onNext(type.id)}
            />
          )
        })}
      </div>
    </div>
  )
}
