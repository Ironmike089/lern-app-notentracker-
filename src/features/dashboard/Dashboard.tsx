import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import type { SchoolProfile } from '../../domain/types'
import { getSchoolProfile } from '../../services/onboardingService'
import { getOverallStats, type OverallStats } from '../../services/gradeStatsService'
import { EmptyState } from '../../components/ui/EmptyState'
import { useSemesterView } from '../app-shell/semesterView'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { DashboardSkeleton } from './DashboardSkeleton'
import { OverallSummaryCard } from './OverallSummaryCard'
import { SubjectCard } from './SubjectCard'

export function Dashboard() {
  const { selectedSemesterId, loading: semesterLoading } = useSemesterView()
  const { version } = useGradeDataVersion()

  const [profile, setProfile] = useState<SchoolProfile | undefined>()
  const [stats, setStats] = useState<OverallStats | undefined>()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedSemesterId) return
    let active = true
    setLoading(true)
    Promise.all([getSchoolProfile(), getOverallStats(selectedSemesterId)]).then(([p, s]) => {
      if (!active) return
      setProfile(p)
      setStats(s)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [selectedSemesterId, version])

  if (semesterLoading || loading || !profile || !stats) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      <OverallSummaryCard profile={profile} stats={stats} />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-soft">Deine Fächer</p>
        {stats.subjects.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" strokeWidth={1.75} />}
            title="Noch keine Fächer"
            description="Füge Fächer in den Einstellungen hinzu."
          />
        ) : (
          <div className="space-y-2">
            {stats.subjects.map((subjectStats) => (
              <SubjectCard key={subjectStats.subject.id} stats={subjectStats} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
