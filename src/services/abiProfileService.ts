import type { AbiProfile } from '../domain/types'
import { createId, nowIso } from '../utils/id'
import { abiProfileRepository, seminarAssessmentRepository, subjectRepository } from '../storage/repositories'

export async function getAbiProfile(): Promise<AbiProfile | undefined> {
  return abiProfileRepository.getById('app')
}

export interface AbiProfileInput {
  ruleVersion: string
  graduationYear: number
  performanceSubjectIds: string[]
  writtenExamSubjectIds: string[]
  oralExamSubjectIds: string[]
}

export async function setAbiProfile(input: AbiProfileInput): Promise<AbiProfile> {
  const existing = await getAbiProfile()
  const timestamp = nowIso()
  const profile: AbiProfile = {
    id: 'app',
    ...input,
    examPoints: existing?.examPoints ?? {},
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }
  await abiProfileRepository.put(profile)
  return profile
}

/** The raw (0–15, pre-weighting) result for one Abitur exam subject — null clears a known value back to "not yet known". */
export async function setExamPoints(subjectId: string, points: number | null): Promise<AbiProfile | undefined> {
  const existing = await getAbiProfile()
  if (!existing) return undefined
  const profile: AbiProfile = {
    ...existing,
    examPoints: { ...existing.examPoints, [subjectId]: points },
    updatedAt: nowIso(),
  }
  await abiProfileRepository.put(profile)
  return profile
}

/**
 * Moves a subject between the written and oral exam-subject lists — the
 * calculator itself treats every ExamResultInput identically regardless of
 * written/oral (see domain/abi/calculator.ts), so this is a pure re-labeling
 * of already-chosen subjects, never a re-derivation of any Abitur rule.
 * examPoints (keyed by subjectId, not by role) is untouched.
 */
export async function setExamSubjectRole(
  subjectId: string,
  role: 'schriftlich' | 'mündlich',
): Promise<AbiProfile | undefined> {
  const existing = await getAbiProfile()
  if (!existing) return undefined
  const writtenExamSubjectIds = existing.writtenExamSubjectIds.filter((id) => id !== subjectId)
  const oralExamSubjectIds = existing.oralExamSubjectIds.filter((id) => id !== subjectId)
  if (role === 'schriftlich') writtenExamSubjectIds.push(subjectId)
  else oralExamSubjectIds.push(subjectId)
  const profile: AbiProfile = { ...existing, writtenExamSubjectIds, oralExamSubjectIds, updatedAt: nowIso() }
  await abiProfileRepository.put(profile)
  return profile
}

export async function clearAbiProfile(): Promise<void> {
  const existing = await getAbiProfile()
  if (existing) await abiProfileRepository.remove(existing.id)
}

/** Creates (or reuses) the one W-Seminar "subject" a Bavaria Abi-Modul offers — see domain/abi/states/by.ts. */
export async function ensureSeminarSubject(existingId: string | undefined, name: string, icon: string): Promise<string> {
  if (existingId) return existingId
  const id = createId()
  await subjectRepository.put({
    id,
    name,
    icon,
    archived: false,
    custom: false,
    kind: 'seminar',
    createdAt: nowIso(),
  })
  await seminarAssessmentRepository.put({ id: createId(), subjectId: id, seminarPaperPoints: null, presentationPoints: null, updatedAt: nowIso() })
  return id
}
