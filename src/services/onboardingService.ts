import type { GradingScale, SchoolProfile, SchoolType, StateCode, Subject } from '../domain/types'
import { createId, nowIso } from '../utils/id'
import {
  schoolProfileRepository,
  subjectRepository,
  userSettingsRepository,
} from '../storage/repositories'
import { ensureCurrentSchoolYear } from './schoolYearService'

export interface OnboardingSelection {
  state: StateCode
  schoolType: SchoolType
  gradeLevel: number
  gradingScale: GradingScale
  upperSecondary: boolean
  subjectSelections: Array<{
    catalogId?: string
    name: string
    icon: string
    custom: boolean
  }>
}

export async function getOnboardingCompleted(): Promise<boolean> {
  const settings = await userSettingsRepository.getById('app')
  return settings?.onboardingCompleted ?? false
}

export async function getSchoolProfile(): Promise<SchoolProfile | undefined> {
  const profiles = await schoolProfileRepository.getAll()
  return profiles[0]
}

/** Persists the full onboarding result and marks setup as complete. */
export async function completeOnboarding(selection: OnboardingSelection): Promise<void> {
  const timestamp = nowIso()

  const profile: SchoolProfile = {
    id: createId(),
    state: selection.state,
    schoolType: selection.schoolType,
    gradeLevel: selection.gradeLevel,
    gradingScale: selection.gradingScale,
    upperSecondary: selection.upperSecondary,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const subjects: Subject[] = selection.subjectSelections.map((s) => ({
    id: createId(),
    name: s.name,
    icon: s.icon,
    archived: false,
    custom: s.custom,
    catalogId: s.catalogId,
    createdAt: timestamp,
  }))

  await schoolProfileRepository.put(profile)
  await subjectRepository.bulkPut(subjects)
  await ensureCurrentSchoolYear()
  await userSettingsRepository.put({
    id: 'app',
    onboardingCompleted: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}
