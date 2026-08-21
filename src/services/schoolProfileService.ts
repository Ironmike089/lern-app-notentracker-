import type { SchoolProfile } from '../domain/types'
import { nowIso } from '../utils/id'
import { schoolProfileRepository } from '../storage/repositories'

export type SchoolProfilePatch = Partial<
  Pick<SchoolProfile, 'state' | 'schoolType' | 'gradeLevel' | 'gradingScale' | 'upperSecondary'>
>

/**
 * Updates the (single) school profile row. Existing GradeEntry rows keep the
 * scale they were recorded under regardless of this change — see
 * GradeEntry.scale in domain/types.ts — so switching gradingScale here never
 * rewrites history, only what new entries default to.
 */
export async function updateSchoolProfile(patch: SchoolProfilePatch): Promise<void> {
  const profiles = await schoolProfileRepository.getAll()
  const current = profiles[0]
  if (!current) return
  await schoolProfileRepository.put({ ...current, ...patch, updatedAt: nowIso() })
}
