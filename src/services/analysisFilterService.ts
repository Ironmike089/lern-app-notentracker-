import { performanceScore } from '../domain/grading'
import { compareSemesters, type PeriodScoreDelta, type SemesterComparisonResult } from '../domain/analytics'
import type { Insight } from '../domain/insights'
import type { GradeEntry, Subject } from '../domain/types'
import { subjectRepository } from '../storage/repositories'
import { getAllSemesters } from './schoolYearService'
import {
  getOverallStats,
  getOverallStatsForDateRange,
  getOverallStatsForSemesters,
  getSubjectInsights,
  getSubjectStatsForDateRange,
  type OverallStats,
} from './gradeStatsService'

function isoDateDaysAgo(days: number, from = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

export type AnalysisDateFilter =
  | { kind: 'currentSemester' }
  | { kind: 'previousSemester' }
  | { kind: 'schoolYear' }
  | { kind: 'custom'; from: string; to: string }

export interface ResolvedAnalysisFilter {
  filter: AnalysisDateFilter
  label: string
  /** False when the filter (e.g. "letztes Halbjahr") has nothing to resolve to yet. */
  available: boolean
}

/** Which concrete filters make sense right now, given the semesters that actually exist. */
export async function getAvailableAnalysisFilters(): Promise<ResolvedAnalysisFilter[]> {
  const semesters = await getAllSemesters()
  const current = semesters.find((s) => s.isCurrent)
  const currentIndex = current ? semesters.findIndex((s) => s.id === current.id) : -1
  const previous = currentIndex > 0 ? semesters[currentIndex - 1] : undefined

  return [
    { filter: { kind: 'currentSemester' }, label: current?.label ?? 'Aktuelles Halbjahr', available: !!current },
    { filter: { kind: 'previousSemester' }, label: previous ? previous.label : 'Letztes Halbjahr', available: !!previous },
    { filter: { kind: 'schoolYear' }, label: 'Gesamtes Schuljahr', available: semesters.length > 0 },
    { filter: { kind: 'custom', from: '', to: '' }, label: 'Eigener Zeitraum', available: true },
  ]
}

export async function getStatsForFilter(filter: AnalysisDateFilter): Promise<OverallStats | null> {
  const semesters = await getAllSemesters()

  if (filter.kind === 'currentSemester') {
    const current = semesters.find((s) => s.isCurrent)
    if (!current) return null
    return getOverallStats(current.id)
  }

  if (filter.kind === 'previousSemester') {
    const current = semesters.find((s) => s.isCurrent)
    const currentIndex = current ? semesters.findIndex((s) => s.id === current.id) : -1
    const previous = currentIndex > 0 ? semesters[currentIndex - 1] : undefined
    if (!previous) return null
    return getOverallStats(previous.id)
  }

  if (filter.kind === 'schoolYear') {
    const current = semesters.find((s) => s.isCurrent) ?? semesters[0]
    if (!current) return null
    const sameYear = semesters.filter((s) => s.schoolYearId === current.schoolYearId)
    return getOverallStatsForSemesters(sameYear.map((s) => s.id))
  }

  // custom range
  if (!filter.from || !filter.to) return null
  return getOverallStatsForDateRange(filter.from, filter.to)
}

/**
 * The same filter resolution as getStatsForFilter above, but as a plain
 * entry predicate — what the new analyticsService.ts calculate*() functions
 * need. Null means "not resolvable yet" (e.g. an incomplete custom range).
 */
export async function resolveEntryFilter(
  filter: AnalysisDateFilter,
): Promise<((entry: GradeEntry) => boolean) | null> {
  const semesters = await getAllSemesters()

  if (filter.kind === 'currentSemester') {
    const current = semesters.find((s) => s.isCurrent)
    if (!current) return null
    return (e) => e.semesterId === current.id
  }

  if (filter.kind === 'previousSemester') {
    const current = semesters.find((s) => s.isCurrent)
    const currentIndex = current ? semesters.findIndex((s) => s.id === current.id) : -1
    const previous = currentIndex > 0 ? semesters[currentIndex - 1] : undefined
    if (!previous) return null
    return (e) => e.semesterId === previous.id
  }

  if (filter.kind === 'schoolYear') {
    const current = semesters.find((s) => s.isCurrent) ?? semesters[0]
    if (!current) return null
    const idSet = new Set(semesters.filter((s) => s.schoolYearId === current.schoolYearId).map((s) => s.id))
    return (e) => idSet.has(e.semesterId)
  }

  // custom range
  if (!filter.from || !filter.to) return null
  const { from, to } = filter
  return (e) => e.date >= from && e.date <= to
}

/** Compares every semester in the current school year that actually has data. */
export async function getSchoolYearSemesterComparison(): Promise<SemesterComparisonResult | null> {
  const semesters = await getAllSemesters()
  const current = semesters.find((s) => s.isCurrent) ?? semesters[0]
  if (!current) return null

  const sameYear = semesters.filter((s) => s.schoolYearId === current.schoolYearId)
  if (sameYear.length < 2) return null

  const perSemester = await Promise.all(sameYear.map((s) => getOverallStats(s.id)))
  return compareSemesters(
    sameYear.map((s, i) => ({ semesterId: s.id, label: s.label, average: perSemester[i].average })),
  )
}

/**
 * Compares overall performance in the last 30 days against everything
 * before that — null (not a fabricated 0%) when either side has no data.
 */
export async function getOverallScoreDeltaLast30Days(): Promise<PeriodScoreDelta | null> {
  const today = isoDateDaysAgo(0)
  const cutoff = isoDateDaysAgo(30)

  const [before, recent] = await Promise.all([
    getOverallStatsForDateRange('0001-01-01', cutoff),
    getOverallStatsForDateRange(cutoff, today),
  ])

  if (before.average.value === null || before.average.scale === null) return null
  if (recent.average.value === null || recent.average.scale === null) return null
  if (before.average.scale !== recent.average.scale) return null

  const delta = performanceScore(recent.average.value, recent.average.scale) - performanceScore(before.average.value, before.average.scale)
  return { delta, improved: delta > 0 }
}

export interface MostImprovedSubject {
  subject: Subject
  delta: number
}

/** Same before/recent-window comparison as the overall delta, per active subject — the biggest positive mover wins. */
export async function getMostImprovedSubject(): Promise<MostImprovedSubject | null> {
  const today = isoDateDaysAgo(0)
  const cutoff = isoDateDaysAgo(30)
  const allSubjects = await subjectRepository.getAll()
  const activeSubjects = allSubjects.filter((s) => !s.archived)

  const candidates = await Promise.all(
    activeSubjects.map(async (subject) => {
      const [before, recent] = await Promise.all([
        getSubjectStatsForDateRange(subject, '0001-01-01', cutoff),
        getSubjectStatsForDateRange(subject, cutoff, today),
      ])
      if (before.average.value === null || before.average.scale === null) return null
      if (recent.average.value === null || recent.average.scale === null) return null
      if (before.average.scale !== recent.average.scale) return null

      const delta =
        performanceScore(recent.average.value, recent.average.scale) -
        performanceScore(before.average.value, before.average.scale)
      return { subject, delta }
    }),
  )

  const improved = candidates.filter((c): c is MostImprovedSubject => c !== null && c.delta > 0)
  if (improved.length === 0) return null
  return improved.reduce((best, c) => (c.delta > best.delta ? c : best))
}

/** Rolled up across all active subjects for the current semester — the "not enough data yet" note is left for each subject's own page, not repeated here. */
export async function getGlobalInsights(): Promise<Insight[]> {
  const semesters = await getAllSemesters()
  const current = semesters.find((s) => s.isCurrent)
  if (!current) return []

  const allSubjects = await subjectRepository.getAll()
  const activeSubjects = allSubjects.filter((s) => !s.archived)
  const perSubject = await Promise.all(activeSubjects.map((s) => getSubjectInsights(s, current.id)))
  return perSubject.flat().filter((insight) => insight.id !== 'trend-insufficient')
}
