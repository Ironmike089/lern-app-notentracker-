import { useNavigate } from 'react-router-dom'
import type { SubjectStats } from '../../services/gradeStatsService'
import { formatGradeValue } from '../../domain/grading'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { Card } from '../../components/ui/Card'
import { PerformanceBar } from '../../components/ui/PerformanceBar'

export function SubjectCard({ stats }: { stats: SubjectStats }) {
  const navigate = useNavigate()
  const { subject, average, performanceScore, performanceTier } = stats

  return (
    <Card
      interactive
      onClick={() => navigate(`/app/subjects/${subject.id}`)}
      className="flex items-center gap-3"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-raised text-ink-soft">
        <SubjectIcon iconKey={subject.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{subject.name}</p>
        {average.value !== null && average.scale !== null && performanceScore !== null && performanceTier ? (
          <PerformanceBar score={performanceScore} tier={performanceTier} size="sm" className="mt-1.5" />
        ) : (
          <p className="text-xs text-ink-faint">Noch keine Noten</p>
        )}
      </div>
      {average.value !== null && average.scale !== null && (
        <p className="shrink-0 text-base font-bold text-ink">{formatGradeValue(average.value, average.scale)}</p>
      )}
    </Card>
  )
}
