import type { SeminarAssessment } from '../domain/types'
import { createId, nowIso } from '../utils/id'
import { seminarAssessmentRepository } from '../storage/repositories'

export async function getSeminarAssessment(subjectId: string): Promise<SeminarAssessment | undefined> {
  const all = await seminarAssessmentRepository.getAll()
  return all.find((a) => a.subjectId === subjectId)
}

export async function setSeminarPoints(
  subjectId: string,
  seminarPaperPoints: number | null,
  presentationPoints: number | null,
): Promise<SeminarAssessment> {
  const existing = await getSeminarAssessment(subjectId)
  const assessment: SeminarAssessment = {
    id: existing?.id ?? createId(),
    subjectId,
    seminarPaperPoints,
    presentationPoints,
    updatedAt: nowIso(),
  }
  await seminarAssessmentRepository.put(assessment)
  return assessment
}
