import type { SchoolYear, Semester } from '../domain/types'
import { createId } from '../utils/id'
import { schoolYearRepository, semesterRepository } from '../storage/repositories'

/**
 * German school years run roughly August–July, split into two Halbjahre.
 * We seed one so the app shell has a "current semester" to display —
 * grade entry against it is a later feature.
 */
export function buildDefaultSchoolYear(referenceDate = new Date()): {
  schoolYear: SchoolYear
  semesters: Semester[]
} {
  const month = referenceDate.getMonth() // 0-indexed, 0 = January
  const startYear = month >= 7 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1
  const endYear = startYear + 1
  const label = `${startYear}/${endYear}`

  const firstHalfActive = month >= 7 || month < 2 // Aug–Jan
  const schoolYearId = createId()

  const schoolYear: SchoolYear = {
    id: schoolYearId,
    label,
    startDate: `${startYear}-08-01`,
    endDate: `${endYear}-07-31`,
    isCurrent: true,
  }

  const semesters: Semester[] = [
    {
      id: createId(),
      schoolYearId,
      label: '1. Halbjahr',
      order: 1,
      isCurrent: firstHalfActive,
    },
    {
      id: createId(),
      schoolYearId,
      label: '2. Halbjahr',
      order: 2,
      isCurrent: !firstHalfActive,
    },
  ]

  return { schoolYear, semesters }
}

export async function ensureCurrentSchoolYear(): Promise<void> {
  const existing = await schoolYearRepository.getAll()
  if (existing.some((y) => y.isCurrent)) return

  const { schoolYear, semesters } = buildDefaultSchoolYear()
  await schoolYearRepository.put(schoolYear)
  await semesterRepository.bulkPut(semesters)
}

export async function getCurrentSemester(): Promise<Semester | undefined> {
  const semesters = await semesterRepository.getAll()
  return semesters.find((s) => s.isCurrent)
}
