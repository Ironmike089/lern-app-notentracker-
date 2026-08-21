import { Sparkles } from 'lucide-react'
import { GERMAN_STATES } from '../../domain/germanStates'
import { SCHOOL_TYPES } from '../../domain/schoolTypes'
import type { SchoolProfile } from '../../domain/types'
import { formatGradeValue } from '../../domain/grading'
import type { OverallStats } from '../../services/gradeStatsService'
import { Card } from '../../components/ui/Card'
import { WarningBanner } from '../../components/ui/WarningBanner'

const MIXED_SCALE_WARNING =
  'Das Bewertungssystem hat sich geändert. Bereits gespeicherte Leistungen werden nicht automatisch umgerechnet.'

function scaleLabel(profile: SchoolProfile): string {
  return profile.gradingScale === 'points_0_15' ? 'Punkte (0–15)' : 'Noten (1–6)'
}

interface OverallSummaryCardProps {
  profile: SchoolProfile
  stats: OverallStats
}

export function OverallSummaryCard({ profile, stats }: OverallSummaryCardProps) {
  const stateName = GERMAN_STATES.find((s) => s.code === profile.state)?.name ?? profile.state
  const schoolTypeName = SCHOOL_TYPES.find((t) => t.id === profile.schoolType)?.name ?? profile.schoolType
  const { average } = stats
  const hasValue = average.value !== null && average.scale !== null

  return (
    <div className="space-y-3">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-soft">Gesamtschnitt</p>
          <span className="rounded-full bg-bg-raised px-2.5 py-1 text-xs font-medium text-ink-soft">
            {scaleLabel(profile)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-bg-raised text-ink-faint">
            <Sparkles className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-2xl font-extrabold text-ink">
              {hasValue ? formatGradeValue(average.value as number, average.scale!) : '–'}
            </p>
            <p className="text-sm text-ink-soft">
              {hasValue ? 'Über alle aktiven Fächer' : 'Noch keine Noten erfasst'}
            </p>
          </div>
        </div>

        <p className="text-xs text-ink-faint">
          {schoolTypeName} · Klasse {profile.gradeLevel} · {stateName}
        </p>
      </Card>

      {stats.mixedScaleWarning && <WarningBanner message={MIXED_SCALE_WARNING} />}
    </div>
  )
}
