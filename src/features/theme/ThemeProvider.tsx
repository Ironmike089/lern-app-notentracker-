import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { ThemePreference } from '../../domain/types'
import { getUserSettings, setThemePreference } from '../../services/settingsService'
import { applyThemeToDocument, readStoredTheme, writeStoredTheme } from '../../utils/theme'
import { ThemeContext } from './themeContext'

/**
 * Theme is applied twice, for two different reasons:
 *  - synchronously in index.html (inline script), reading localStorage,
 *    so there's no flash of the wrong theme before React even loads
 *  - here, once the real UserSettings row is known, in case it disagrees
 *    with the localStorage cache (e.g. an import changed it elsewhere)
 * localStorage stays the fast/offline-safe cache; Dexie is the source of
 * truth once it's loaded, so it round-trips through export/import.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => readStoredTheme())
  const themeRef = useRef(theme)
  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    let active = true
    getUserSettings().then((settings) => {
      if (!active || !settings.theme || settings.theme === themeRef.current) return
      setThemeState(settings.theme)
      writeStoredTheme(settings.theme)
      applyThemeToDocument(settings.theme)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    applyThemeToDocument(theme)
  }, [theme])

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next)
    writeStoredTheme(next)
    setThemePreference(next).catch(() => {
      // Onboarding not finished yet or storage briefly unavailable — the
      // localStorage cache above still keeps the choice for this session.
    })
  }, [])

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
