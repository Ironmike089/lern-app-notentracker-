import { useEffect, useState } from 'react'
import { Layers } from 'lucide-react'
import { getOverallStats, type OverallStats } from '../../services/gradeStatsService'
import { EmptyState } from '../../components/ui/EmptyState'
import { useSemesterView } from '../app-shell/semesterView'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton'
import { SubjectCard } from '../dashboard/SubjectCard'
import { SubjectSortControl } from '../dashboard/SubjectSortControl'
import { sortSubjects, type SubjectSortOption } from '../dashboard/subjectSort'

export function SubjectsListPage() {
  const { selectedSemesterId, loading: semesterLoading } = useSemesterView()
  const { version } = useGradeDataVersion()

  const [stats, setStats] = useState<OverallStats | undefined>()
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<SubjectSortOption>('manual')

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

  const sortedSubjects = sortSubjects(stats.subjects, sortBy)

  return (
    <div className="mx-auto w-full max-w-md space-y-4 md:max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Deine Fächer</h1>
        {stats.subjects.length > 0 && <SubjectSortControl value={sortBy} onChange={setSortBy} />}
      </div>

      {stats.subjects.length === 0 ? (
        <EmptyState
          icon={<Layers className="h-5 w-5" strokeWidth={1.75} />}
          title="Noch keine Fächer"
          description="Deine Fächer aus dem Setup erscheinen hier."
        />
      ) : (
        <div className="space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
          {sortedSubjects.map((subjectStats) => (
            <SubjectCard key={subjectStats.subject.id} stats={subjectStats} />
          ))}
        </div>
      )}
    </div>
  )
}
