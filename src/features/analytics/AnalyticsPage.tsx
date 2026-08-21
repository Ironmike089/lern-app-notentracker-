import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { formatGradeValue, performanceColorVar, performanceScore } from '../../domain/grading'
import { getOverallStats, type OverallStats, type SubjectStats } from '../../services/gradeStatsService'
import { EmptyState } from '../../components/ui/EmptyState'
import { Card } from '../../components/ui/Card'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { useSemesterView } from '../app-shell/semesterView'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton'
import { sortSubjects } from '../dashboard/subjectSort'
import { AttentionSection } from '../dashboard/AttentionSection'
import { getAttentionSubjects } from '../dashboard/attention'

function StatTile({ label, subject }: { label: string; subject: SubjectStats | undefined }) {
  if (!subject || subject.average.value === null || subject.average.scale === null) {
    return (
      <Card className="flex-1 space-y-1">
        <p className="text-xs font-medium text-ink-faint">{label}</p>
        <p className="text-lg font-bold text-ink-faint">–</p>
      </Card>
    )
  }
  return (
    <Card className="flex-1 space-y-1">
      <p className="text-xs font-medium text-ink-faint">{label}</p>
      <p className="truncate text-sm font-semibold text-ink">{subject.subject.name}</p>
      <p className="text-lg font-bold text-ink">{formatGradeValue(subject.average.value, subject.average.scale)}</p>
    </Card>
  )
}

export function AnalyticsPage() {
  const { selectedSemesterId, loading: semesterLoading } = useSemesterView()
  const { version } = useGradeDataVersion()

  const [stats, setStats] = useState<OverallStats | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedSemesterId) return
    let active = true
    setLoading(true)
    getOverallStats(selectedSemesterId).then((s) => {
      if (!active) return
      setStats(s)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [selectedSemesterId, version])

  if (semesterLoading || loading || !stats) return <DashboardSkeleton />

  const withScore = stats.subjects.filter((s) => s.performanceScore !== null)

  if (withScore.length === 0) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 lg:max-w-2xl">
        <h1 className="text-xl font-bold text-ink">Analyse</h1>
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" strokeWidth={1.75} />}
          title="Noch nichts zu analysieren"
          description="Sobald du Noten einträgst, siehst du hier deine Rangfolge und Entwicklung."
        />
      </div>
    )
  }

  const ranked = sortSubjects(stats.subjects, 'best').filter((s) => s.performanceScore !== null)
  const best = ranked[0]
  const weakest = ranked[ranked.length - 1]
  const overallScore =
    stats.average.value !== null && stats.average.scale !== null
      ? performanceScore(stats.average.value, stats.average.scale)
      : null
  const attentionSubjects = getAttentionSubjects(stats.subjects, overallScore)

  return (
    <div className="mx-auto w-full max-w-md space-y-6 lg:max-w-2xl">
      <h1 className="text-xl font-bold text-ink">Analyse</h1>

      <div className="flex gap-3">
        <StatTile label="Bestes Fach" subject={best} />
        <StatTile label="Größter Aufholbedarf" subject={weakest?.subject.id !== best?.subject.id ? weakest : undefined} />
      </div>

      <AttentionSection subjects={attentionSubjects} />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-soft">Rangfolge</p>
        <div className="space-y-2">
          {ranked.map((s, index) => (
            <Card key={s.subject.id} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-xs font-bold text-ink-faint">{index + 1}</span>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-raised"
                style={{ color: s.performanceTier ? performanceColorVar(s.performanceTier) : undefined }}
              >
                <SubjectIcon iconKey={s.subject.icon} className="h-4 w-4" />
              </span>
              <p className="flex-1 truncate text-sm font-medium text-ink">{s.subject.name}</p>
              {s.average.value !== null && s.average.scale !== null && (
                <p className="shrink-0 text-sm font-bold text-ink">
                  {formatGradeValue(s.average.value, s.average.scale)}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
