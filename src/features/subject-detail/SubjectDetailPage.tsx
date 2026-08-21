import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import type { GradeEntry, Subject } from '../../domain/types'
import { formatGradeValue } from '../../domain/grading'
import { subjectRepository } from '../../storage/repositories'
import { getSubjectStats, type SubjectStats } from '../../services/gradeStatsService'
import { archiveSubject } from '../../services/subjectService'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { PerformanceBar } from '../../components/ui/PerformanceBar'
import { WarningBanner } from '../../components/ui/WarningBanner'
import { Button } from '../../components/ui/Button'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useSemesterView } from '../app-shell/semesterView'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { EditGradeSheet } from '../grades/EditGradeSheet'
import { LeistungenTab } from './LeistungenTab'
import { StatistikTab } from './StatistikTab'
import { EinstellungenTab } from './EinstellungenTab'

const MIXED_SCALE_WARNING =
  'Das Bewertungssystem hat sich geändert. Bereits gespeicherte Leistungen werden nicht automatisch umgerechnet.'

type SubjectTab = 'leistungen' | 'statistik' | 'einstellungen'

const TAB_OPTIONS: { value: SubjectTab; label: string }[] = [
  { value: 'leistungen', label: 'Leistungen' },
  { value: 'statistik', label: 'Statistik' },
  { value: 'einstellungen', label: 'Einstellungen' },
]

export function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const { selectedSemesterId, loading: semesterLoading } = useSemesterView()
  const { version, bumpVersion } = useGradeDataVersion()

  const [subject, setSubject] = useState<Subject | undefined>()
  const [stats, setStats] = useState<SubjectStats | undefined>()
  const [loading, setLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState<GradeEntry | null>(null)
  const [tab, setTab] = useState<SubjectTab>('leistungen')

  useEffect(() => {
    if (!subjectId || !selectedSemesterId) return
    let active = true
    setLoading(true)
    subjectRepository.getById(subjectId).then(async (s) => {
      if (!active || !s) return
      const subjectStats = await getSubjectStats(s, selectedSemesterId)
      if (!active) return
      setSubject(s)
      setStats(subjectStats)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [subjectId, selectedSemesterId, version])

  async function handleArchive() {
    if (!subject) return
    if (!window.confirm(`„${subject.name}“ archivieren? Es erscheint dann nicht mehr im Dashboard.`)) return
    await archiveSubject(subject.id)
    navigate('/app', { replace: true })
  }

  if (semesterLoading || loading || !subject || !stats) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 lg:max-w-xl">
        <div className="h-8 w-32 animate-pulse rounded-control bg-bg-card" />
        <div className="h-24 w-full animate-pulse rounded-card bg-bg-card" />
        <div className="h-40 w-full animate-pulse rounded-card bg-bg-card" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 lg:max-w-xl">
      <button
        type="button"
        onClick={() => navigate('/app/subjects')}
        className="flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        Fächer
      </button>

      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bg-raised text-ink-soft">
          <SubjectIcon iconKey={subject.icon} className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{subject.name}</p>
          <p className="text-3xl font-extrabold text-ink tabular-nums">
            {stats.average.value !== null && stats.average.scale !== null
              ? formatGradeValue(stats.average.value, stats.average.scale)
              : '–'}
          </p>
          <p className="text-xs text-ink-faint">aktueller Schnitt</p>
        </div>
      </div>

      {stats.mixedScaleWarning && <WarningBanner message={MIXED_SCALE_WARNING} />}

      {stats.performanceScore !== null && stats.performanceTier !== null && (
        <PerformanceBar score={stats.performanceScore} tier={stats.performanceTier} />
      )}

      <SegmentedControl value={tab} onChange={setTab} options={TAB_OPTIONS} aria-label="Fachansicht wählen" />

      {tab === 'leistungen' && (
        <LeistungenTab subject={subject} stats={stats} onEditEntry={setEditingEntry} />
      )}
      {tab === 'statistik' && <StatistikTab stats={stats} />}
      {tab === 'einstellungen' && (
        <EinstellungenTab
          subjectId={subject.id}
          categories={stats.categories.map((c) => c.category)}
          onChanged={bumpVersion}
        />
      )}

      <Button variant="ghost" size="md" onClick={handleArchive} className="text-ink-faint hover:text-danger">
        Fach archivieren
      </Button>

      <EditGradeSheet
        entry={editingEntry}
        subject={subject}
        semesterId={selectedSemesterId!}
        categories={stats.categories.map((c) => c.category)}
        onClose={() => setEditingEntry(null)}
        onChanged={bumpVersion}
      />
    </div>
  )
}
