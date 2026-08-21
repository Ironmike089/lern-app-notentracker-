import { validateCategoryWeight } from '../domain/grading'
import { SUBJECT_COLOR_KEYS, type SubjectColorKey } from '../domain/subjectColors'
import { subjectRepository } from '../storage/repositories'

/** Reuses the category-weight validation rule (non-negative) — the same constraint applies to course weighting. */
export async function setSubjectWeight(id: string, weight: number): Promise<void> {
  const check = validateCategoryWeight(weight)
  if (!check.valid) throw new Error(check.error)
  const subject = await subjectRepository.getById(id)
  if (!subject) return
  await subjectRepository.put({ ...subject, weight })
}

export async function setSubjectColor(id: string, color: SubjectColorKey): Promise<void> {
  if (!SUBJECT_COLOR_KEYS.includes(color)) throw new Error('Unbekannte Fachfarbe.')
  const subject = await subjectRepository.getById(id)
  if (!subject) return
  await subjectRepository.put({ ...subject, color })
}

export async function archiveSubject(id: string): Promise<void> {
  const subject = await subjectRepository.getById(id)
  if (!subject) return
  await subjectRepository.put({ ...subject, archived: true })
}

export async function unarchiveSubject(id: string): Promise<void> {
  const subject = await subjectRepository.getById(id)
  if (!subject) return
  await subjectRepository.put({ ...subject, archived: false })
}
