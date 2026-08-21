import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, Plus } from 'lucide-react'
import type { GradeEntry, Subject } from '../../domain/types'
import { formatGradeValue } from '../../domain/grading'
import { subjectRepository } from '../../storage/repositories'
import { getSubjectStats, type SubjectStats } from '../../services/gradeStatsService'
import { archiveSubject } from '../../services/subjectService'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { PerformanceBar } from '../../components/ui/PerformanceBar'
import { WarningBanner } from '../../components/ui/WarningBanner'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { useSemesterView } from '../app-shell/semesterView'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { useQuickAdd } from '../grades/quickAdd'
import { EditGradeSheet } from '../grades/EditGradeSheet'

const MIXED_SCALE_WARNING =
  'Das Bewertungssystem hat sich geändert. Bereits gespeicherte Leistungen werden nicht automatisch umgerechnet.'

export function SubjectDetailPage() {
  const { subjectId } = useParams<{ subjectId: string }>()
  const navigate = useNavigate()
  const { selectedSemesterId, loading: semesterLoading } = useSemesterView()
  const { version, bumpVersion } = useGradeDataVersion()
  const { openQuickAdd } = useQuickAdd()

  const [subject, setSubject] = useState<Subject | undefined>()
  const [stats, setStats] = useState<SubjectStats | undefined>()
  const [loading, setLoading] = useState(true)
  const [editingEntry, setEditingEntry] = useState<GradeEntry | null>(null)

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
      <div className="space-y-4">
        <div className="h-8 w-32 animate-pulse rounded-control bg-bg-card" />
        <div className="h-24 w-full animate-pulse rounded-card bg-bg-card" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/app')}
        className="flex items-center gap-1 text-sm text-ink-soft transition-colors hover:text-ink"
      >
        <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        Übersicht
      </button>

      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bg-raised text-ink-soft">
          <SubjectIcon iconKey={subject.icon} className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{subject.name}</p>
          <p className="text-3xl font-extrabold text-ink">
            {stats.average.value !== null && stats.average.scale !== null
              ? formatGradeValue(stats.average.value, stats.average.scale)
              : '–'}
          </p>
        </div>
      </div>

      {stats.mixedScaleWarning && <WarningBanner message={MIXED_SCALE_WARNING} />}

      {stats.performanceScore !== null && stats.performanceTier !== null && (
        <PerformanceBar score={stats.performanceScore} tier={stats.performanceTier} />
      )}

      <div className="space-y-3">
        {stats.categories.length === 0 ? (
          <EmptyState
            icon={<Plus className="h-5 w-5" strokeWidth={1.75} />}
            title="Noch keine Kategorien"
            description="Für dieses Fach wurden noch keine Bewertungskategorien angelegt."
          />
        ) : (
          stats.categories.map((categoryStats) => {
            const enabledWeightSum = stats.categories
              .filter((c) => c.category.enabled)
              .reduce((sum, c) => sum + c.category.weight, 0)
            const percent =
              categoryStats.category.enabled && enabledWeightSum > 0
                ? Math.round((categoryStats.category.weight / enabledWeightSum) * 100)
                : null

            return (
              <Card key={categoryStats.category.id} className={!categoryStats.category.enabled ? 'opacity-60' : undefined}>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                    {categoryStats.category.name}
                    {!categoryStats.category.enabled && (
                      <span className="ml-2 rounded-full bg-bg-raised px-2 py-0.5 text-[10px] font-medium normal-case text-ink-faint">
                        Deaktiviert
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-faint">
                    {categoryStats.average.value !== null && categoryStats.average.scale !== null && (
                      <>Ø {formatGradeValue(categoryStats.average.value, categoryStats.average.scale)} · </>
                    )}
                    {percent !== null ? `Gewichtung ${percent}%` : `Gewichtung ${categoryStats.category.weight}x`}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categoryStats.entries.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      onClick={() => setEditingEntry(entry)}
                      className="flex h-9 min-w-9 items-center justify-center rounded-control border border-border bg-bg-raised px-2.5 text-sm font-semibold text-ink transition-all duration-200 hover:border-border-strong active:scale-95"
                    >
                      {entry.value}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => openQuickAdd({ subjectId: subject.id, categoryId: categoryStats.category.id })}
                    aria-label={`Note zu ${categoryStats.category.name} hinzufügen`}
                    className="flex h-9 w-9 items-center justify-center rounded-control border border-dashed border-border-strong text-ink-soft transition-all duration-200 hover:border-mint hover:text-mint active:scale-95"
                  >
                    <Plus className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Button variant="ghost" size="md" onClick={handleArchive} className="text-ink-faint hover:text-danger">
        Fach archivieren
      </Button>

      <EditGradeSheet
        entry={editingEntry}
        categories={stats.categories.map((c) => c.category)}
        onClose={() => setEditingEntry(null)}
        onChanged={bumpVersion}
      />
    </div>
  )
}
