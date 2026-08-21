import type { SubjectGoal } from '../domain/types'
import { createId, nowIso } from '../utils/id'
import { subjectGoalRepository } from '../storage/repositories'

/** Goals are scoped per subject + semester — "2.0 this Halbjahr" rather than a single lifelong target. */
export async function getGoal(subjectId: string, semesterId: string): Promise<SubjectGoal | undefined> {
  const all = await subjectGoalRepository.getAll()
  return all.find((g) => g.subjectId === subjectId && g.semesterId === semesterId)
}

export async function setGoal(subjectId: string, semesterId: string, targetValue: number): Promise<SubjectGoal> {
  const existing = await getGoal(subjectId, semesterId)
  const timestamp = nowIso()
  const goal: SubjectGoal = existing
    ? { ...existing, targetValue, updatedAt: timestamp }
    : { id: createId(), subjectId, semesterId, targetValue, createdAt: timestamp, updatedAt: timestamp }
  await subjectGoalRepository.put(goal)
  return goal
}

export async function clearGoal(subjectId: string, semesterId: string): Promise<void> {
  const existing = await getGoal(subjectId, semesterId)
  if (existing) await subjectGoalRepository.remove(existing.id)
}
