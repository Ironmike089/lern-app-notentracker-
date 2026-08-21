import type { ThemePreference } from '../domain/types'

const STORAGE_KEY = 'notentracker:theme'
const THEME_COLOR_DARK = '#0c1310'
const THEME_COLOR_LIGHT = '#f5f8f6'

function resolveEffectiveTheme(theme: ThemePreference): 'dark' | 'light' {
  if (theme !== 'system') return theme
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function syncThemeColorMeta(theme: ThemePreference): void {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (!meta) return
  meta.setAttribute('content', resolveEffectiveTheme(theme) === 'light' ? THEME_COLOR_LIGHT : THEME_COLOR_DARK)
}

/** Applies the theme to the document root. 'system' means "no override" — CSS media queries take it from there. */
export function applyThemeToDocument(theme: ThemePreference): void {
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', theme)
  }
  syncThemeColorMeta(theme)
}

/** Reads the last-applied theme preference. Synchronous — safe to call before any Dexie read resolves. */
export function readStoredTheme(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : 'system'
  } catch {
    return 'system'
  }
}

export function writeStoredTheme(theme: ThemePreference): void {
  try {
    if (theme === 'system') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      localStorage.setItem(STORAGE_KEY, theme)
    }
  } catch {
    // Storage unavailable (private mode, quota) — the in-memory context state still works for this session.
  }
}
