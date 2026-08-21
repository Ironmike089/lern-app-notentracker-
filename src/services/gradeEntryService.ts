import type { GradeEntry } from '../domain/types'
import { validateEntryWeight, validateGradeValue } from '../domain/grading'
import { createId, nowIso } from '../utils/id'
import { gradeEntryRepository, schoolProfileRepository } from '../storage/repositories'

export interface CreateGradeEntryInput {
  subjectId: string
  categoryId: string
  semesterId: string
  value: number
  weight?: number
  date?: string
  title?: string
  note?: string
}

/** The scale is always taken from the current SchoolProfile at creation time and then frozen on the entry. */
export async function createGradeEntry(input: CreateGradeEntryInput): Promise<GradeEntry> {
  const profiles = await schoolProfileRepository.getAll()
  const profile = profiles[0]
  if (!profile) throw new Error('Kein Schulprofil vorhanden.')

  const scale = profile.gradingScale
  const valueCheck = validateGradeValue(input.value, scale)
  if (!valueCheck.valid) throw new Error(valueCheck.error)

  const weight = input.weight ?? 1
  const weightCheck = validateEntryWeight(weight)
  if (!weightCheck.valid) throw new Error(weightCheck.error)

  const timestamp = nowIso()
  const entry: GradeEntry = {
    id: createId(),
    subjectId: input.subjectId,
    categoryId: input.categoryId,
    semesterId: input.semesterId,
    value: input.value,
    scale,
    weight,
    date: input.date ?? timestamp.slice(0, 10),
    title: input.title?.trim() || 'Note',
    note: input.note?.trim() || undefined,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await gradeEntryRepository.put(entry)
  return entry
}

export interface UpdateGradeEntryInput {
  value?: number
  categoryId?: string
  semesterId?: string
  weight?: number
  date?: string
  title?: string
  note?: string
}

/**
 * Value/weight are validated against the entry's own frozen `scale` — never
 * against the profile's current scale, which may have changed since.
 */
export async function updateGradeEntry(id: string, patch: UpdateGradeEntryInput): Promise<GradeEntry> {
  const existing = await gradeEntryRepository.getById(id)
  if (!existing) throw new Error('Note nicht gefunden.')

  const nextValue = patch.value ?? existing.value
  const valueCheck = validateGradeValue(nextValue, existing.scale)
  if (!valueCheck.valid) throw new Error(valueCheck.error)

  const nextWeight = patch.weight ?? existing.weight ?? 1
  const weightCheck = validateEntryWeight(nextWeight)
  if (!weightCheck.valid) throw new Error(weightCheck.error)

  const updated: GradeEntry = {
    ...existing,
    value: nextValue,
    categoryId: patch.categoryId ?? existing.categoryId,
    semesterId: patch.semesterId ?? existing.semesterId,
    weight: nextWeight,
    date: patch.date ?? existing.date,
    title: patch.title !== undefined ? patch.title.trim() || 'Note' : existing.title,
    note: patch.note !== undefined ? patch.note.trim() || undefined : existing.note,
    updatedAt: nowIso(),
  }
  await gradeEntryRepository.put(updated)
  return updated
}

export async function deleteGradeEntry(id: string): Promise<GradeEntry | undefined> {
  const existing = await gradeEntryRepository.getById(id)
  if (!existing) return undefined
  await gradeEntryRepository.remove(id)
  return existing
}
