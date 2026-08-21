import type { AssessmentCategory, Subject } from '../domain/types'
import { buildDefaultCategories } from '../domain/assessmentCategories'
import { createId, nowIso } from '../utils/id'
import {
  assessmentCategoryRepository,
  gradeEntryRepository,
  schoolProfileRepository,
  subjectGoalRepository,
  subjectRepository,
  userSettingsRepository,
} from '../storage/repositories'
import { ensureCurrentSchoolYear, getCurrentSemester } from './schoolYearService'

interface DemoEntrySeed {
  category: string
  value: number
  daysAgo: number
}

interface DemoSubjectSeed {
  name: string
  icon: string
  catalogId: string
  entries: DemoEntrySeed[]
}

// Deliberately varied: Englisch demonstrates a strong/near-goal subject,
// Mathematik an improving trend with a goal set, Geschichte a single entry
// (too little data for a trend — shows the "noch nicht genügend Daten" path).
const DEMO_SUBJECTS: DemoSubjectSeed[] = [
  {
    name: 'Mathematik',
    icon: 'sigma',
    catalogId: 'mathematik',
    entries: [
      { category: 'Schulaufgaben', value: 4, daysAgo: 50 },
      { category: 'Mündlich', value: 3, daysAgo: 38 },
      { category: 'Kurzarbeiten', value: 3, daysAgo: 24 },
      { category: 'Schulaufgaben', value: 2, daysAgo: 9 },
    ],
  },
  {
    name: 'Deutsch',
    icon: 'book-open',
    catalogId: 'deutsch',
    entries: [
      { category: 'Schulaufgaben', value: 2, daysAgo: 42 },
      { category: 'Mündlich', value: 2, daysAgo: 27 },
      { category: 'Schulaufgaben', value: 2, daysAgo: 12 },
    ],
  },
  {
    name: 'Englisch',
    icon: 'languages',
    catalogId: 'englisch',
    entries: [
      { category: 'Schulaufgaben', value: 1, daysAgo: 35 },
      { category: 'Mündlich', value: 1, daysAgo: 20 },
      { category: 'Schulaufgaben', value: 2, daysAgo: 6 },
    ],
  },
  {
    name: 'Biologie',
    icon: 'leaf',
    catalogId: 'biologie',
    entries: [
      { category: 'Schulaufgaben', value: 4, daysAgo: 30 },
      { category: 'Mündlich', value: 3, daysAgo: 15 },
    ],
  },
  {
    name: 'Geschichte',
    icon: 'landmark',
    catalogId: 'geschichte',
    entries: [{ category: 'Mündlich', value: 3, daysAgo: 5 }],
  },
  {
    name: 'Sport',
    icon: 'dumbbell',
    catalogId: 'sport',
    entries: [
      { category: 'Sonstige Leistungen', value: 1, daysAgo: 40 },
      { category: 'Sonstige Leistungen', value: 2, daysAgo: 18 },
      { category: 'Sonstige Leistungen', value: 1, daysAgo: 3 },
    ],
  },
]

function isoDateDaysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

/**
 * Seeds a full, realistic Realschule/Bayern demo dataset — for previewing
 * the app's intelligent features without entering data by hand. Only ever
 * called from an explicit "Demo ansehen" action (never automatically), and
 * refuses to run if a real profile already exists so it can never overwrite
 * an actual user's data.
 */
export async function seedDemoData(): Promise<void> {
  const existingProfiles = await schoolProfileRepository.getAll()
  if (existingProfiles.length > 0) {
    throw new Error('Es existiert bereits ein Schulprofil — der Demo-Modus überschreibt keine echten Daten.')
  }

  const timestamp = nowIso()

  await schoolProfileRepository.put({
    id: createId(),
    state: 'BY',
    schoolType: 'realschule',
    gradeLevel: 8,
    gradingScale: 'grade_1_6',
    upperSecondary: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  await ensureCurrentSchoolYear({ upperSecondary: false })
  const semester = await getCurrentSemester()
  if (!semester) throw new Error('Demo-Halbjahr konnte nicht angelegt werden.')

  for (const subjectSeed of DEMO_SUBJECTS) {
    const subject: Subject = {
      id: createId(),
      name: subjectSeed.name,
      icon: subjectSeed.icon,
      archived: false,
      custom: false,
      catalogId: subjectSeed.catalogId,
      createdAt: timestamp,
    }
    await subjectRepository.put(subject)

    const categories = buildDefaultCategories(subject.id, createId)
    await assessmentCategoryRepository.bulkPut(categories)
    const categoryByName = new Map<string, AssessmentCategory>(categories.map((c) => [c.name, c]))

    for (const entrySeed of subjectSeed.entries) {
      const category = categoryByName.get(entrySeed.category)
      if (!category) continue
      await gradeEntryRepository.put({
        id: createId(),
        subjectId: subject.id,
        categoryId: category.id,
        semesterId: semester.id,
        value: entrySeed.value,
        scale: 'grade_1_6',
        weight: 1,
        date: isoDateDaysAgo(entrySeed.daysAgo),
        title: 'Demo-Note',
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    }

    if (subjectSeed.name === 'Mathematik') {
      await subjectGoalRepository.put({
        id: createId(),
        subjectId: subject.id,
        semesterId: semester.id,
        targetValue: 2,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
    }
  }

  await userSettingsRepository.put({
    id: 'app',
    onboardingCompleted: true,
    theme: 'system',
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}
