import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { SubjectStats } from '../../services/gradeStatsService'
import { performanceColorVar } from '../../domain/grading'
import { SubjectIcon } from '../../components/icons/subjectIcon'

export function AttentionSection({ subjects }: { subjects: SubjectStats[] }) {
  const navigate = useNavigate()
  if (subjects.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-soft">Aufmerksamkeit</p>
      <div className="space-y-2">
        {subjects.map((s) => (
          <button
            key={s.subject.id}
            type="button"
            onClick={() => navigate(`/app/subjects/${s.subject.id}`)}
            className="flex w-full items-center gap-3 rounded-card border border-border bg-bg-card p-3.5 text-left transition-colors duration-200 hover:bg-bg-card-hover"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-raised"
              style={{ color: s.performanceTier ? performanceColorVar(s.performanceTier) : undefined }}
            >
              <SubjectIcon iconKey={s.subject.icon} className="h-4 w-4" />
            </span>
            <p className="flex-1 text-sm text-ink-soft">
              <span className="font-semibold text-ink">{s.subject.name}</span> liegt aktuell unter deinem
              Durchschnitt.
            </p>
            <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} />
          </button>
        ))}
      </div>
    </div>
  )
}
