import type { Subject } from './types'

/**
 * Subject identity colors (System A) — kept strictly separate from the
 * performance tier colors in grading.ts (System B: quality of a result).
 * A subject's color never reacts to its grades; see index.css for the
 * actual --color-subject-* hex values (dark/light variants).
 */
export const SUBJECT_COLOR_KEYS = [
  'blue',
  'orange',
  'violet',
  'green',
  'teal',
  'navy',
  'cyan',
  'amber',
  'emerald',
  'red',
  'pink',
  'purple',
  'gold',
  'coral',
  'sky',
  'plum',
  'steel',
  'brown',
  'lime',
  'rose',
] as const

export type SubjectColorKey = (typeof SUBJECT_COLOR_KEYS)[number]

const DEFAULT_COLOR_KEY: SubjectColorKey = 'steel'

/** Design preset — a starting point, not an official rule. Fully overridable per subject via Subject.color. */
const CATALOG_COLOR_PRESET: Record<string, SubjectColorKey> = {
  mathematik: 'blue',
  deutsch: 'orange',
  englisch: 'violet',
  franzoesisch: 'navy',
  spanisch: 'coral',
  italienisch: 'rose',
  latein: 'gold',
  griechisch: 'sky',

  biologie: 'green',
  chemie: 'teal',
  physik: 'navy',
  informatik: 'cyan',
  'natur-und-technik': 'lime',

  geschichte: 'amber',
  geographie: 'emerald',
  'politik-und-gesellschaft': 'steel',
  sozialkunde: 'steel',
  'wirtschaft-und-recht': 'brown',
  wirtschaft: 'brown',
  sozialwissenschaften: 'steel',

  ethik: 'plum',
  'religion-evangelisch': 'plum',
  'religion-katholisch': 'plum',
  philosophie: 'plum',

  kunst: 'pink',
  musik: 'purple',
  sport: 'red',
  'darstellendes-spiel': 'rose',
}

function hashColorKey(seed: string): SubjectColorKey {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  }
  return SUBJECT_COLOR_KEYS[hash % SUBJECT_COLOR_KEYS.length]
}

/**
 * Resolves the color a subject should render with: an explicit user choice
 * (Subject.color) wins, then the catalog preset, then a deterministic
 * fallback (stable across renders/sessions) for custom subjects with no
 * catalog entry — so every subject gets *some* distinct color immediately.
 */
export function getSubjectColorKey(subject: Pick<Subject, 'color' | 'catalogId' | 'name'>): SubjectColorKey {
  if (subject.color && (SUBJECT_COLOR_KEYS as readonly string[]).includes(subject.color)) {
    return subject.color as SubjectColorKey
  }
  if (subject.catalogId && CATALOG_COLOR_PRESET[subject.catalogId]) {
    return CATALOG_COLOR_PRESET[subject.catalogId]
  }
  return subject.name ? hashColorKey(subject.name) : DEFAULT_COLOR_KEY
}

export function subjectColorVar(key: SubjectColorKey): string {
  return `var(--color-subject-${key})`
}
