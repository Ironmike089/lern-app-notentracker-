import { useEffect, useState, type ReactNode } from 'react'
import { ArchiveRestore, GraduationCap, Pencil } from 'lucide-react'
import { GERMAN_STATES } from '../../domain/germanStates'
import { SCHOOL_TYPES } from '../../domain/schoolTypes'
import type { SchoolProfile, Semester, Subject } from '../../domain/types'
import { getSchoolProfile } from '../../services/onboardingService'
import { getAllSemesters } from '../../services/schoolYearService'
import { subjectRepository } from '../../storage/repositories'
import { unarchiveSubject } from '../../services/subjectService'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { useToast } from '../../components/ui/toastContext'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton'
import { SemesterManager } from './SemesterManager'
import { UpperSecondaryNotice } from './UpperSecondaryNotice'
import { SchoolProfileSheet } from './SchoolProfileSheet'
import { ThemeSection } from './ThemeSection'
import { DataSection } from './DataSection'
import { AbiSettingsSection } from '../abi/AbiSettingsSection'

function scaleLabel(profile: SchoolProfile): string {
  return profile.gradingScale === 'points_0_15' ? 'Punkte (0–15)' : 'Noten (1–6)'
}

export function MorePage() {
  const { showToast } = useToast()
  const { version, bumpVersion } = useGradeDataVersion()

  const [profile, setProfile] = useState<SchoolProfile | undefined>()
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [archivedSubjects, setArchivedSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [editingProfile, setEditingProfile] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([getSchoolProfile(), getAllSemesters(), subjectRepository.getAll()]).then(
      ([p, allSemesters, subjects]) => {
        if (!active) return
        setProfile(p)
        setSemesters(allSemesters)
        setArchivedSubjects(subjects.filter((s) => s.archived))
        setLoading(false)
      },
    )
    return () => {
      active = false
    }
  }, [version])

  if (loading || !profile) return <DashboardSkeleton />

  const stateName = GERMAN_STATES.find((s) => s.code === profile.state)?.name ?? profile.state
  const schoolTypeName = SCHOOL_TYPES.find((t) => t.id === profile.schoolType)?.name ?? profile.schoolType

  async function handleReactivate(subject: Subject) {
    await unarchiveSubject(subject.id)
    bumpVersion()
    showToast(`„${subject.name}“ ist wieder aktiv.`, 'success')
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-8 md:max-w-2xl">
      <h1 className="text-xl font-bold text-ink">Einstellungen</h1>

      <SettingsGroup label="Allgemein">
        <ThemeSection />
      </SettingsGroup>

      <SettingsGroup label="Schule">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Schulprofil</p>
          <Card className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bg-raised text-ink-soft">
              <GraduationCap className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">
                {schoolTypeName} · Klasse {profile.gradeLevel}
              </p>
              <p className="text-xs text-ink-faint">
                {stateName} · {scaleLabel(profile)}
              </p>
            </div>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setEditingProfile(true)}
              aria-label="Schulprofil bearbeiten"
            >
              <Pencil className="h-4 w-4" strokeWidth={2} />
            </Button>
          </Card>
          {profile.upperSecondary && <UpperSecondaryNotice state={profile.state} />}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Schuljahr</p>
          <SemesterManager semesters={semesters} onRenamed={bumpVersion} />
        </div>

        {profile.upperSecondary && <AbiSettingsSection profile={profile} onChanged={bumpVersion} />}

        {archivedSubjects.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink-soft">Archivierte Fächer</p>
            <div className="space-y-2">
              {archivedSubjects.map((subject) => (
                <Card key={subject.id} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg-raised text-ink-faint">
                    <SubjectIcon iconKey={subject.icon} className="h-4 w-4" />
                  </span>
                  <p className="flex-1 truncate text-sm font-medium text-ink-soft">{subject.name}</p>
                  <Button variant="secondary" size="md" onClick={() => handleReactivate(subject)}>
                    <ArchiveRestore className="h-4 w-4" strokeWidth={2} />
                    Reaktivieren
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}
      </SettingsGroup>

      <SettingsGroup label="Daten & Konto">
        <DataSection />
      </SettingsGroup>

      <SettingsGroup label="Info">
        <Card>
          <p className="text-sm text-ink">Notentracker</p>
          <p className="text-xs text-ink-faint">
            Version {__APP_VERSION__} · lokal auf diesem Gerät gespeichert, keine Cloud, kein Tracking
          </p>
        </Card>
      </SettingsGroup>

      <SchoolProfileSheet
        open={editingProfile}
        onClose={() => setEditingProfile(false)}
        profile={profile}
        onChanged={bumpVersion}
      />
    </div>
  )
}

function SettingsGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-ink-faint">{label}</p>
      <div className="space-y-5">{children}</div>
    </div>
  )
}
