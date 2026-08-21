/**
 * Core domain entities for the Notentracker.
 * Kept intentionally flat and serializable so they map 1:1 onto Dexie tables.
 */

export type StateCode =
  | 'BW'
  | 'BY'
  | 'BE'
  | 'BB'
  | 'HB'
  | 'HH'
  | 'HE'
  | 'MV'
  | 'NI'
  | 'NW'
  | 'RP'
  | 'SL'
  | 'SN'
  | 'ST'
  | 'SH'
  | 'TH'

export type SchoolType = 'hauptschule' | 'realschule' | 'gymnasium'

export type GradingScale = 'grade_1_6' | 'points_0_15'

export type ThemePreference = 'system' | 'dark' | 'light'

export interface UserSettings {
  id: 'app'
  onboardingCompleted: boolean
  /** Absent on rows created before this setting existed — treat as 'system'. */
  theme?: ThemePreference
  createdAt: string
  updatedAt: string
}

export interface SchoolProfile {
  id: string
  state: StateCode
  schoolType: SchoolType
  gradeLevel: number
  gradingScale: GradingScale
  upperSecondary: boolean
  createdAt: string
  updatedAt: string
}

export interface SchoolYear {
  id: string
  label: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface Semester {
  id: string
  schoolYearId: string
  label: string
  order: number
  isCurrent: boolean
}

export interface Subject {
  id: string
  name: string
  icon: string
  color?: string
  archived: boolean
  custom: boolean
  catalogId?: string
  /**
   * Optional relative course weighting (e.g. 2 for a 2x-weighted Leistungskurs)
   * used when combining subjects into the overall average. Defaults to 1 when
   * absent. A user setting / future state preset — never presented as an
   * official rule that applies everywhere.
   */
  weight?: number
  createdAt: string
}

/**
 * How a category's grades were produced — powers the "schriftlich vs.
 * mündlich" analysis without guessing from the category name (a category
 * called "Test" could be written or oral depending on the school/subject).
 */
export type CategoryType = 'written' | 'oral' | 'presentation' | 'practical' | 'other'

export interface AssessmentCategory {
  id: string
  subjectId: string
  name: string
  weight: number
  enabled: boolean
  sortOrder: number
  /** Absent on categories created before this setting existed — treated as 'other' (excluded from written/oral analysis). */
  categoryType?: CategoryType
}

export interface GradeEntry {
  id: string
  subjectId: string
  semesterId: string
  categoryId: string
  value: number
  /**
   * Grading scale this entry was recorded under — a permanent snapshot, not
   * derived from the current SchoolProfile. If the profile's scale changes
   * later, existing entries keep the scale they were actually entered in,
   * so the engine can detect and refuse to blend incompatible values later.
   */
  scale: GradingScale
  weight?: number
  date: string
  title: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface SubjectGoal {
  id: string
  subjectId: string
  semesterId?: string
  targetValue: number
  createdAt: string
  updatedAt: string
}
