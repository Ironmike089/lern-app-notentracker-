import type { SchoolType } from './types'

export interface SchoolTypeInfo {
  id: SchoolType
  name: string
  description: string
  /** Class levels shown for this school type before upper-secondary branching. */
  gradeLevels: number[]
  /** Grade levels at which upper-secondary (points scale) may already apply. */
  upperSecondaryLevels: number[]
}

export const SCHOOL_TYPES: SchoolTypeInfo[] = [
  {
    id: 'hauptschule',
    name: 'Hauptschule',
    description: 'Klassen 5–9/10',
    gradeLevels: [5, 6, 7, 8, 9, 10],
    upperSecondaryLevels: [],
  },
  {
    id: 'realschule',
    name: 'Realschule',
    description: 'Klassen 5–10',
    gradeLevels: [5, 6, 7, 8, 9, 10],
    upperSecondaryLevels: [],
  },
  {
    id: 'gymnasium',
    name: 'Gymnasium',
    description: 'Klassen 5–13, inkl. Oberstufe',
    gradeLevels: [5, 6, 7, 8, 9, 10, 11, 12, 13],
    upperSecondaryLevels: [10, 11, 12, 13],
  },
]
