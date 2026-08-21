import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import type { SchoolProfile } from '../../domain/types'
import { performanceScore } from '../../domain/grading'
import { getSchoolProfile } from '../../services/onboardingService'
import { getOverallStats, getOverallTrend, type OverallStats, type OverallTrend } from '../../services/gradeStatsService'
import { EmptyState } from '../../components/ui/EmptyState'
import { Button } from '../../components/ui/Button'
import { useSemesterView } from '../app-shell/semesterView'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { useQuickAdd } from '../grades/quickAdd'
import { DashboardSkeleton } from './DashboardSkeleton'
import { DashboardHero } from './DashboardHero'
import { SubjectCard } from './SubjectCard'
import { SubjectSortControl } from './SubjectSortControl'
import { sortSubjects, type SubjectSortOption } from './subjectSort'
import { AttentionSection } from './AttentionSection'
import { getAttentionSubjects } from './attention'

export function Dashboard() {
  const { selectedSemesterId, loading: semesterLoading } = useSemesterView()
  const { version } = useGradeDataVersion()
  const { openQuickAdd } = useQuickAdd()

  const [profile, setProfile] = useState<SchoolProfile | undefined>()
  const [stats, setStats] = useState<OverallStats | undefined>()
  const [trend, setTrend] = useState<OverallTrend | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SubjectSortOption>('manual')

  useEffect(() => {
    if (!selectedSemesterId) return
    let active = true
    setLoading(true)
    Promise.all([
      getSchoolProfile(),
      getOverallStats(selectedSemesterId),
      getOverallTrend(selectedSemesterId),
    ]).then(([p, s, t]) => {
      if (!active) return
      setProfile(p)
      setStats(s)
      setTrend(t)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [selectedSemesterId, version])

  if (semesterLoading || loading || !profile || !stats) return <DashboardSkeleton />

  if (stats.subjects.length === 0) {
    return (
      <EmptyState
        icon={<Sparkles className="h-5 w-5" strokeWidth={1.75} />}
        title="Keine aktiven Fächer"
        description="Reaktiviere ein archiviertes Fach unter „Mehr“, um wieder Noten einzutragen."
      />
    )
  }

  const totalEntries = stats.subjects.reduce(
    (sum, s) => sum + s.categories.reduce((catSum, c) => catSum + c.entries.length, 0),
    0,
  )

  const overallScore =
    stats.average.value !== null && stats.average.scale !== null
      ? performanceScore(stats.average.value, stats.average.scale)
      : null
  const attentionSubjects = getAttentionSubjects(stats.subjects, overallScore)
  const sortedSubjects = sortSubjects(stats.subjects, sortBy)

  return (
    <div className="space-y-6 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6 lg:space-y-0">
      <DashboardHero
        profile={profile}
        stats={stats}
        trend={trend}
        activeSubjectsCount={stats.subjects.length}
        totalEntries={totalEntries}
      />

      <div className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2">
        {totalEntries === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-5 w-5" strokeWidth={1.75} />}
            title="Noch keine Noten"
            description="Füge deine erste Leistung hinzu und dein Schnitt erscheint hier."
            action={
              <Button size="md" onClick={() => openQuickAdd()}>
                Erste Note eintragen
              </Button>
            }
          />
        ) : (
          <AttentionSection subjects={attentionSubjects} />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-soft">Deine Fächer</p>
          <SubjectSortControl value={sortBy} onChange={setSortBy} />
        </div>
        <div className="space-y-2">
          {sortedSubjects.map((subjectStats) => (
            <SubjectCard key={subjectStats.subject.id} stats={subjectStats} />
          ))}
        </div>
      </div>
    </div>
  )
}
