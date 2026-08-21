import type { SubjectStats } from '../../services/gradeStatsService'

export type SubjectSortOption = 'manual' | 'alphabetical' | 'best' | 'worst' | 'updated'

export const SORT_OPTIONS: { value: SubjectSortOption; label: string }[] = [
  { value: 'manual', label: 'Manuell' },
  { value: 'alphabetical', label: 'Alphabetisch' },
  { value: 'best', label: 'Beste zuerst' },
  { value: 'worst', label: 'Schwächste zuerst' },
  { value: 'updated', label: 'Zuletzt aktualisiert' },
]

function lastUpdatedAt(stats: SubjectStats): string {
  const timestamps = stats.categories.flatMap((c) => c.entries.map((e) => e.updatedAt))
  return timestamps.reduce((max, t) => (t > max ? t : max), stats.subject.createdAt)
}

export function sortSubjects(subjects: SubjectStats[], sortBy: SubjectSortOption): SubjectStats[] {
  switch (sortBy) {
    case 'alphabetical':
      return [...subjects].sort((a, b) => a.subject.name.localeCompare(b.subject.name, 'de'))
    case 'best':
      return [...subjects].sort((a, b) => (b.performanceScore ?? -1) - (a.performanceScore ?? -1))
    case 'worst':
      return [...subjects].sort((a, b) => (a.performanceScore ?? 101) - (b.performanceScore ?? 101))
    case 'updated':
      return [...subjects].sort((a, b) => lastUpdatedAt(b).localeCompare(lastUpdatedAt(a)))
    case 'manual':
    default:
      return subjects
  }
}
