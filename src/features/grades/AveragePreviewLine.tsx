import { formatGradeValue, isHigherBetter } from '../../domain/grading'
import type { SubjectAveragePreview } from '../../services/gradeStatsService'
import { cn } from '../../utils/cn'

interface AveragePreviewLineProps {
  subjectName: string
  preview: SubjectAveragePreview | null
}

/**
 * "Dein Mathe-Schnitt würde sich von 2,17 auf 2,08 verbessern." — shown live
 * as the user picks a value, before anything is saved.
 */
export function AveragePreviewLine({ subjectName, preview }: AveragePreviewLineProps) {
  if (!preview) return null

  const { before, after } = preview
  if (after.value === null || after.scale === null) return null
  const afterValue = after.value
  const afterScale = after.scale

  if (before.value === null || before.scale === null) {
    return (
      <p className="animate-fade-in text-sm text-ink-soft">
        Dein <span className="font-semibold text-ink">{subjectName}</span>-Schnitt würde bei{' '}
        <span className="font-semibold text-ink">{formatGradeValue(afterValue, afterScale)}</span> starten.
      </p>
    )
  }
  const beforeValue = before.value
  const beforeScale = before.scale

  if (beforeValue === afterValue) {
    return (
      <p className="animate-fade-in text-sm text-ink-soft">
        Dein {subjectName}-Schnitt bliebe bei {formatGradeValue(afterValue, afterScale)}.
      </p>
    )
  }

  const improved = isHigherBetter(afterScale) ? afterValue > beforeValue : afterValue < beforeValue

  return (
    <p className="animate-fade-in text-sm text-ink-soft">
      Dein <span className="font-semibold text-ink">{subjectName}</span>-Schnitt würde sich von{' '}
      {formatGradeValue(beforeValue, beforeScale)} auf{' '}
      <span className={cn('font-semibold', improved ? 'text-perf-excellent' : 'text-perf-warning')}>
        {formatGradeValue(afterValue, afterScale)}
      </span>{' '}
      {improved ? 'verbessern' : 'verschlechtern'}.
    </p>
  )
}
