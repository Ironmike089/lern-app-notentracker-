import { db } from './db'
import { createRepository } from './createRepository'

export const userSettingsRepository = createRepository(db.userSettings)
export const schoolProfileRepository = createRepository(db.schoolProfiles)
export const schoolYearRepository = createRepository(db.schoolYears)
export const semesterRepository = createRepository(db.semesters)
export const subjectRepository = createRepository(db.subjects)
export const assessmentCategoryRepository = createRepository(db.assessmentCategories)
export const gradeEntryRepository = createRepository(db.gradeEntries)
export const subjectGoalRepository = createRepository(db.subjectGoals)
