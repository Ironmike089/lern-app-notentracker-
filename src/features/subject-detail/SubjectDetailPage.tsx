import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Calculator, ChevronLeft, FlaskConical, Target } from 'lucide-react'
import type { GradeEntry, GradingScale, Subject, SubjectGoal } from '../../domain/types'
import { formatGradeValue, performanceScore, pointsToGradeLabel } from '../../domain/grading'
import { getSchoolProfile } from '../../services/onboardingService'
import { subjectRepository } from '../../storage/repositories'
import { getSubjectStats, type SubjectStats } from '../../services/gradeStatsService'
import { archiveSubject } from '../../services/subjectService'
import { getGoal } from '../../services/subjectGoalService'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { PerformanceBar } from '../../components/ui/PerformanceBar'
import { WarningBanner } from '../../components/ui/WarningBanner'
import { Button } from '../../components/ui/Button'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { useSemesterView } from '../app-shell/semesterView'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { EditGradeSheet } from '../grades/EditGradeSheet'
import { SimulateGradeSheet } from '../grades/SimulateGradeSheet'
import { GoalSheet } from '../grades/GoalSheet'
import { GoalSolverSheet } from '../grades/GoalSolverSheet'
import { LeistungenTab } from './LeistungenTab'
import { StatistikTab } from './StatistikTab'
import { EinstellungenTab } from './EinstellungenTab'

const MIXED_SCALE_WARNING =
  'Das Bewertungssystem hat sich geändert. Bereits gespeicherte Leistungen werden nicht automatisch umgerechnet.'

type SubjectTab = 'leistungen' | 'statistik' | 'einstellungen'

const TAB_OPTIONS: { value: SubjectTab; label: string }[] = [
  { value: 'leistungen', label: 'Leistungen' },
  { value: 'statistik', label: 'Statistik' },
  { value: 'einstellungen', label: 'Kategorien' },
]

export function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const { selectedSemesterId, loading: semesterLoading } = useSemesterView()
  const { version, bumpVersion } = useGradeDataVersion()

  const [subject, setSubject] = useState<Subject | undefined>()
  const [stats, setStats] = useState<SubjectStats | undefined>()
  const [gradingScale, setGradingScale] = useState<GradingScale | undefined>()
  const [goal, setGoal] = useState<SubjectGoal | undefined>()
  const [loading, setLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState<GradeEntry | null>(null)
  const [tab, setTab] = useState<SubjectTab>('leistungen')
  const [simulating, setSimulating] = useState(false)
  const [editingGoal, setEditingGoal] = useState(false)
  const [solving, setSolving] = useState(false)

  // Only show the full-page skeleton on a genuine navigation to a different
  // subject/semester, not on a background refetch triggered by a version
  // bump elsewhere (e.g. a grade saved from the global Quick Add FAB) —
  // otherwise the whole subtree unmounts and remounts on every such bump,
  // silently closing/resetting any sheet the user has open here.
  const loadedKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (!subjectId || !selectedSemesterId) return
    let active = true
    const loadKey = `${subjectId}:${selectedSemesterId}`
    if (loadedKeyRef.current !== loadKey) setLoading(true)
    Promise.all([
      subjectRepository.getById(subjectId),
      getSchoolProfile(),
      getGoal(subjectId, selectedSemesterId),
    ]).then(async ([s, profile, currentGoal]) => {
      if (!active || !s) return
      const subjectStats = await getSubjectStats(s, selectedSemesterId)
      if (!active) return
      setSubject(s)
      setStats(subjectStats)
      setGradingScale(profile?.gradingScale)
      setGoal(currentGoal)
      setLoading(false)
      loadedKeyRef.current = loadKey
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

  if (semesterLoading || loading || !subject || !stats || !gradingScale) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 md:max-w-xl">
        <div className="h-8 w-32 animate-pulse rounded-control bg-bg-card" />
        <div className="h-24 w-full animate-pulse rounded-card bg-bg-card" />
        <div className="h-40 w-full animate-pulse rounded-card bg-bg-card" />
      </div>
    )
  }

  const goalScore = goal ? performanceScore(goal.targetValue, gradingScale) : undefined

  return (
    <div className="mx-auto w-full max-w-md space-y-6 md:max-w-xl">
      <button
        type="button"
        onClick={() => navigate('/app/subjects')}
        className="flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        Fächer
      </button>

      <div className="flex items-center justify-between gap-3">
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
            <p className="text-xs text-ink-faint">
              aktueller Schnitt
              {stats.average.value !== null && stats.average.scale === 'points_0_15' && (
                <> · ≈ Note {pointsToGradeLabel(stats.average.value)}</>
              )}
            </p>
          </div>
        </div>

        {goal && (
          <div className="text-right">
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Ziel</p>
            <p className="text-xl font-bold text-mint tabular-nums">
              {formatGradeValue(goal.targetValue, gradingScale)}
            </p>
          </div>
        )}
      </div>

      {stats.mixedScaleWarning && <WarningBanner message={MIXED_SCALE_WARNING} />}

      {stats.performanceScore !== null && stats.performanceTier !== null && (
        <PerformanceBar score={stats.performanceScore} tier={stats.performanceTier} goalScore={goalScore} />
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="md" onClick={() => setSimulating(true)}>
          <FlaskConical className="h-4 w-4" strokeWidth={2} />
          Note simulieren
        </Button>
        <Button variant="secondary" size="md" onClick={() => setEditingGoal(true)}>
          <Target className="h-4 w-4" strokeWidth={2} />
          {goal ? 'Ziel bearbeiten' : 'Ziel setzen'}
        </Button>
        <Button variant="secondary" size="md" onClick={() => setSolving(true)}>
          <Calculator className="h-4 w-4" strokeWidth={2} />
          Was brauche ich?
        </Button>
      </div>

      <SegmentedControl value={tab} onChange={setTab} options={TAB_OPTIONS} aria-label="Fachansicht wählen" />

      {tab === 'leistungen' && (
        <LeistungenTab subject={subject} stats={stats} onEditEntry={setEditingEntry} />
      )}
      {tab === 'statistik' && (
        <StatistikTab subject={subject} stats={stats} semesterId={selectedSemesterId!} />
      )}
      {tab === 'einstellungen' && (
        <EinstellungenTab
          subjectId={subject.id}
          subjectName={subject.name}
          subjectWeight={subject.weight ?? 1}
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

      <SimulateGradeSheet
        open={simulating}
        onClose={() => setSimulating(false)}
        subject={subject}
        semesterId={selectedSemesterId!}
        scale={gradingScale}
        categories={stats.categories.map((c) => c.category)}
        onCommitted={bumpVersion}
      />

      <GoalSheet
        open={editingGoal}
        onClose={() => setEditingGoal(false)}
        subject={subject}
        semesterId={selectedSemesterId!}
        scale={gradingScale}
        currentGoal={goal}
        onSaved={bumpVersion}
      />

      <GoalSolverSheet
        open={solving}
        onClose={() => setSolving(false)}
        subject={subject}
        semesterId={selectedSemesterId!}
        scale={gradingScale}
        categories={stats.categories.map((c) => c.category)}
        currentGoal={goal}
      />
    </div>
  )
}
