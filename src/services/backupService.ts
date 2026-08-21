import type {
  AssessmentCategory,
  GradeEntry,
  SchoolProfile,
  SchoolYear,
  Semester,
  Subject,
  SubjectGoal,
  UserSettings,
} from '../domain/types'
import { nowIso } from '../utils/id'
import { db } from '../storage/db'
import {
  assessmentCategoryRepository,
  gradeEntryRepository,
  schoolProfileRepository,
  schoolYearRepository,
  semesterRepository,
  subjectGoalRepository,
  subjectRepository,
  userSettingsRepository,
} from '../storage/repositories'

/**
 * Bump whenever the exported shape changes in a way that needs migration on
 * import. Import rejects anything with a *newer* version than this (an
 * export from a future app version) and, for now, anything older too since
 * there is nothing yet to migrate from — that gate is exactly what makes
 * migration additions later safe.
 */
export const BACKUP_VERSION = 1

export interface BackupData {
  userSettings: UserSettings | null
  schoolProfile: SchoolProfile | null
  schoolYears: SchoolYear[]
  semesters: Semester[]
  subjects: Subject[]
  assessmentCategories: AssessmentCategory[]
  gradeEntries: GradeEntry[]
  subjectGoals: SubjectGoal[]
}

export interface BackupFile {
  version: number
  exportedAt: string
  data: BackupData
}

export async function buildBackup(): Promise<BackupFile> {
  const [userSettings, schoolProfile, schoolYears, semesters, subjects, assessmentCategories, gradeEntries, subjectGoals] =
    await Promise.all([
      userSettingsRepository.getById('app'),
      schoolProfileRepository.getAll().then((rows) => rows[0]),
      schoolYearRepository.getAll(),
      semesterRepository.getAll(),
      subjectRepository.getAll(),
      assessmentCategoryRepository.getAll(),
      gradeEntryRepository.getAll(),
      subjectGoalRepository.getAll(),
    ])

  return {
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    data: {
      userSettings: userSettings ?? null,
      schoolProfile: schoolProfile ?? null,
      schoolYears,
      semesters,
      subjects,
      assessmentCategories,
      gradeEntries,
      subjectGoals,
    },
  }
}

export function downloadBackup(backup: BackupFile, filename: string): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function backupFilename(prefix = 'notentracker-backup'): string {
  const stamp = nowIso().replace(/[:.]/g, '-').slice(0, 19)
  return `${prefix}-${stamp}.json`
}

export interface ImportValidationError {
  reason: string
}

/** Structural validation only — never throws, always returns a typed result so the UI can show a clear message instead of crashing. */
export function validateBackup(raw: unknown): { valid: true; backup: BackupFile } | { valid: false; error: string } {
  if (typeof raw !== 'object' || raw === null) {
    return { valid: false, error: 'Die Datei enthält kein gültiges JSON-Objekt.' }
  }
  const candidate = raw as Record<string, unknown>

  if (typeof candidate.version !== 'number') {
    return { valid: false, error: 'Die Datei enthält keine gültige Versionsnummer.' }
  }
  if (candidate.version !== BACKUP_VERSION) {
    return {
      valid: false,
      error: `Diese Datei stammt aus Version ${candidate.version} und kann von dieser App-Version (${BACKUP_VERSION}) nicht gelesen werden.`,
    }
  }
  if (typeof candidate.exportedAt !== 'string') {
    return { valid: false, error: 'Die Datei enthält kein gültiges Exportdatum.' }
  }
  if (typeof candidate.data !== 'object' || candidate.data === null) {
    return { valid: false, error: 'Die Datei enthält keine gültigen Daten.' }
  }

  const data = candidate.data as Record<string, unknown>
  const arrayFields: (keyof BackupData)[] = [
    'schoolYears',
    'semesters',
    'subjects',
    'assessmentCategories',
    'gradeEntries',
    'subjectGoals',
  ]
  for (const field of arrayFields) {
    if (!Array.isArray(data[field])) {
      return { valid: false, error: `Die Datei ist beschädigt (Feld „${field}“ fehlt oder ist ungültig).` }
    }
  }

  return { valid: true, backup: candidate as unknown as BackupFile }
}

/** Parses + validates a File without ever throwing — bad JSON, wrong shape, and I/O errors all come back as a message instead of crashing the app. */
export async function readBackupFile(file: File): Promise<{ valid: true; backup: BackupFile } | { valid: false; error: string }> {
  let text: string
  try {
    text = await file.text()
  } catch {
    return { valid: false, error: 'Die Datei konnte nicht gelesen werden.' }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { valid: false, error: 'Die Datei enthält kein gültiges JSON.' }
  }

  return validateBackup(parsed)
}

/**
 * Replaces all local data with the backup's contents in one Dexie
 * transaction — either it all lands, or (on any error) none of it does, so
 * a bad import can never leave the database half-overwritten.
 */
export async function restoreBackup(backup: BackupFile): Promise<void> {
  const { data } = backup
  await db.transaction(
    'rw',
    [db.userSettings, db.schoolProfiles, db.schoolYears, db.semesters, db.subjects, db.assessmentCategories, db.gradeEntries, db.subjectGoals],
    async () => {
      await Promise.all([
        db.userSettings.clear(),
        db.schoolProfiles.clear(),
        db.schoolYears.clear(),
        db.semesters.clear(),
        db.subjects.clear(),
        db.assessmentCategories.clear(),
        db.gradeEntries.clear(),
        db.subjectGoals.clear(),
      ])
      await Promise.all([
        data.userSettings ? db.userSettings.put(data.userSettings) : Promise.resolve(),
        data.schoolProfile ? db.schoolProfiles.put(data.schoolProfile) : Promise.resolve(),
        db.schoolYears.bulkPut(data.schoolYears),
        db.semesters.bulkPut(data.semesters),
        db.subjects.bulkPut(data.subjects),
        db.assessmentCategories.bulkPut(data.assessmentCategories),
        db.gradeEntries.bulkPut(data.gradeEntries),
        db.subjectGoals.bulkPut(data.subjectGoals),
      ])
    },
  )
}

/**
 * Wipes every local table plus any localStorage state (e.g. the theme
 * preference) — a full reset, not just the grade data — and returns the app
 * to a truly blank slate. Used by "Alle Daten löschen"; the caller is
 * responsible for the confirmation UX.
 */
export async function deleteAllData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.userSettings, db.schoolProfiles, db.schoolYears, db.semesters, db.subjects, db.assessmentCategories, db.gradeEntries, db.subjectGoals],
    async () => {
      await Promise.all([
        db.userSettings.clear(),
        db.schoolProfiles.clear(),
        db.schoolYears.clear(),
        db.semesters.clear(),
        db.subjects.clear(),
        db.assessmentCategories.clear(),
        db.gradeEntries.clear(),
        db.subjectGoals.clear(),
      ])
    },
  )
  try {
    localStorage.clear()
  } catch {
    // Storage unavailable (private mode) — the IndexedDB wipe above already did the part that matters.
  }
}
