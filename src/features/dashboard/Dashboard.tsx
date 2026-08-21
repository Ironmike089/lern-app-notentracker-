import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import type { SchoolProfile, Subject } from '../../domain/types'
import { getSchoolProfile } from '../../services/onboardingService'
import { subjectRepository } from '../../storage/repositories'
import { EmptyState } from '../../components/ui/EmptyState'
import { DashboardSkeleton } from './DashboardSkeleton'
import { OverallSummaryCard } from './OverallSummaryCard'
import { SubjectCard } from './SubjectCard'

type LoadState = 'loading' | 'ready'

export function Dashboard() {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [profile, setProfile] = useState<SchoolProfile | undefined>()
  const [subjects, setSubjects] = useState<Subject[]>([])

  useEffect(() => {
    let active = true
    Promise.all([getSchoolProfile(), subjectRepository.getAll()]).then(([p, allSubjects]) => {
      if (!active) return
      setProfile(p)
      setSubjects(allSubjects.filter((s) => !s.archived))
      setLoadState('ready')
    })
    return () => {
      active = false
    }
  }, [])

  if (loadState === 'loading') return <DashboardSkeleton />
  if (!profile) return null

  return (
    <div className="space-y-6">
      <OverallSummaryCard profile={profile} />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-soft">Deine Fächer</p>
        {subjects.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-5 w-5" strokeWidth={1.75} />}
            title="Noch keine Fächer"
            description="Füge Fächer in den Einstellungen hinzu."
          />
        ) : (
          <div className="space-y-2">
            {subjects.map((subject) => (
              <SubjectCard key={subject.id} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
