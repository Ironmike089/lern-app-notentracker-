import type { ThemePreference, UserSettings } from '../domain/types'
import { nowIso } from '../utils/id'
import { userSettingsRepository } from '../storage/repositories'

/** Reads the persisted UserSettings row, or a safe default if onboarding hasn't created one yet. */
export async function getUserSettings(): Promise<UserSettings> {
  const existing = await userSettingsRepository.getById('app')
  if (existing) return existing
  const timestamp = nowIso()
  return { id: 'app', onboardingCompleted: false, theme: 'system', createdAt: timestamp, updatedAt: timestamp }
}

/** Persists the theme choice on the settings row, creating it if onboarding hasn't finished yet. */
export async function setThemePreference(theme: ThemePreference): Promise<void> {
  const current = await getUserSettings()
  await userSettingsRepository.put({ ...current, theme, updatedAt: nowIso() })
}
