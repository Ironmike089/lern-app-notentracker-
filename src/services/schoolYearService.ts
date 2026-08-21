import type { SchoolYear, Semester } from '../domain/types'
import { createId } from '../utils/id'
import { schoolYearRepository, semesterRepository } from '../storage/repositories'

/**
 * German school years run roughly August–July. Regular students see two
 * Halbjahre; gymnasiale Oberstufe students track four Kurshalbjahre
 * (commonly Q1–Q4). Labels stay fully renameable afterwards since the exact
 * naming varies by school/state model.
 */
export function buildDefaultSchoolYear(
  profile: { upperSecondary: boolean },
  referenceDate = new Date(),
): { schoolYear: SchoolYear; semesters: Semester[] } {
  const month = referenceDate.getMonth() // 0-indexed, 0 = January
  const startYear = month >= 7 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1
  const endYear = startYear + 1
  const label = `${startYear}/${endYear}`
  const schoolYearId = createId()

  const schoolYear: SchoolYear = {
    id: schoolYearId,
    label,
    startDate: `${startYear}-08-01`,
    endDate: `${endYear}-07-31`,
    isCurrent: true,
  }

  const semesters: Semester[] = profile.upperSecondary
    ? buildQuarterSemesters(schoolYearId, month)
    : buildHalfYearSemesters(schoolYearId, month)

  return { schoolYear, semesters }
}

function buildHalfYearSemesters(schoolYearId: string, month: number): Semester[] {
  const firstHalfActive = month >= 7 || month < 2 // Aug–Jan
  return [
    { id: createId(), schoolYearId, label: '1. Halbjahr', order: 1, isCurrent: firstHalfActive },
    { id: createId(), schoolYearId, label: '2. Halbjahr', order: 2, isCurrent: !firstHalfActive },
  ]
}

// Rough quarter mapping by calendar month (0=Jan..11=Dec): Aug-Oct=Q1, Nov-Jan=Q2, Feb-Apr=Q3, May-Jul=Q4.
const MONTH_TO_QUARTER_INDEX = [1, 2, 2, 2, 3, 3, 3, 0, 0, 0, 1, 1]

function buildQuarterSemesters(schoolYearId: string, month: number): Semester[] {
  const currentIndex = MONTH_TO_QUARTER_INDEX[month]
  const labels = ['Q1', 'Q2', 'Q3', 'Q4']
  return labels.map((label, index) => ({
    id: createId(),
    schoolYearId,
    label,
    order: index + 1,
    isCurrent: index === currentIndex,
  }))
}

export async function ensureCurrentSchoolYear(profile: { upperSecondary: boolean }): Promise<void> {
  const existing = await schoolYearRepository.getAll()
  if (existing.some((y) => y.isCurrent)) return

  const { schoolYear, semesters } = buildDefaultSchoolYear(profile)
  await schoolYearRepository.put(schoolYear)
  await semesterRepository.bulkPut(semesters)
}

export async function getCurrentSemester(): Promise<Semester | undefined> {
  const semesters = await semesterRepository.getAll()
  return semesters.find((s) => s.isCurrent)
}

export async function getAllSemesters(): Promise<Semester[]> {
  const semesters = await semesterRepository.getAll()
  return semesters.sort((a, b) => a.order - b.order)
}

export async function renameSemester(id: string, label: string): Promise<void> {
  const semester = await semesterRepository.getById(id)
  if (!semester) return
  await semesterRepository.put({ ...semester, label: label.trim() || semester.label })
}
