import Dexie, { type Table } from 'dexie'
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

/**
 * Local-first persistence layer (IndexedDB via Dexie).
 *
 * Migration strategy: never edit an existing `.version(n)` block once it has
 * shipped. Add a new `.version(n + 1).stores({...}).upgrade(tx => {...})`
 * instead, so existing users' data is migrated forward instead of dropped.
 */
export class NotentrackerDb extends Dexie {
  userSettings!: Table<UserSettings, string>
  schoolProfiles!: Table<SchoolProfile, string>
  schoolYears!: Table<SchoolYear, string>
  semesters!: Table<Semester, string>
  subjects!: Table<Subject, string>
  assessmentCategories!: Table<AssessmentCategory, string>
  gradeEntries!: Table<GradeEntry, string>
  subjectGoals!: Table<SubjectGoal, string>

  constructor() {
    super('notentracker')

    this.version(1).stores({
      userSettings: 'id',
      schoolProfiles: 'id',
      schoolYears: 'id, isCurrent',
      semesters: 'id, schoolYearId, isCurrent',
      subjects: 'id, archived',
      assessmentCategories: 'id, subjectId',
      gradeEntries: 'id, subjectId, semesterId, categoryId, date',
      subjectGoals: 'id, subjectId, semesterId',
    })
  }
}

export const db = new NotentrackerDb()
