import type { AssessmentCategory, CategoryType, GradeEntry, GradingScale, Subject } from '../domain/types'
import { categoryAverage, overallAverage, performanceScore, subjectAverage, type AverageResult } from '../domain/grading'
import {
  calculateConsistency,
  calculateImprovement,
  calculateStreakAboveRunningAverage,
  calculateStreakAboveThreshold,
  calculateWrittenVsOral,
  type ConsistencyResult,
  type PeriodImprovement,
  type TrendPoint,
  type WrittenVsOralResult,
} from '../domain/analytics'
import { assessmentCategoryRepository, gradeEntryRepository, subjectRepository } from '../storage/repositories'

/**
 * DB-fetching orchestration for the Analyse page's calculate*() functions in
 * domain/analytics.ts — the math itself stays pure and unit-tested there;
 * this module's only job is loading + shaping the entries each one needs.
 * All functions share the same `entryFilter` convention as gradeStatsService.
 */

interface LoadedContext {
  subjects: Subject[]
  categoriesById: Map<string, AssessmentCategory>
  entries: GradeEntry[]
}

async function loadContext(entryFilter: (entry: GradeEntry) => boolean): Promise<LoadedContext> {
  const [allSubjects, allCategories, allEntries] = await Promise.all([
    subjectRepository.getAll(),
    assessmentCategoryRepository.getAll(),
    gradeEntryRepository.getAll(),
  ])
  const subjects = allSubjects.filter((s) => !s.archived)
  const activeSubjectIds = new Set(subjects.map((s) => s.id))
  const categoriesById = new Map(allCategories.map((c) => [c.id, c]))
  const entries = allEntries.filter((e) => activeSubjectIds.has(e.subjectId) && entryFilter(e))
  return { subjects, categoriesById, entries }
}

// ---------------------------------------------------------------------------
// Performance history — the "Alle Fächer" trend line: a chronological
// snapshot of the overall average as of each date that has an entry.
// ---------------------------------------------------------------------------

export async function calculatePerformanceHistory(entryFilter: (entry: GradeEntry) => boolean): Promise<TrendPoint[]> {
  const { subjects, categoriesById, entries } = await loadContext(entryFilter)
  const dates = [...new Set(entries.map((e) => e.date))].sort()

  const points: TrendPoint[] = []
  for (const date of dates) {
    const upToDate = entries.filter((e) => e.date <= date)
    const bySubject = new Map<string, GradeEntry[]>()
    for (const entry of upToDate) {
      const list = bySubject.get(entry.subjectId) ?? []
      list.push(entry)
      bySubject.set(entry.subjectId, list)
    }

    const subjectAverages = subjects.map((subject) => {
      const subjectEntries = bySubject.get(subject.id) ?? []
      const byCategory = new Map<string, GradeEntry[]>()
      for (const entry of subjectEntries) {
        const list = byCategory.get(entry.categoryId) ?? []
        list.push(entry)
        byCategory.set(entry.categoryId, list)
      }
      const categoryAverages = [...byCategory.entries()]
        .map(([categoryId, catEntries]) => {
          const category = categoriesById.get(categoryId)
          if (!category?.enabled) return null
          return {
            average: categoryAverage(catEntries.map((e) => ({ value: e.value, weight: e.weight ?? 1, scale: e.scale }))),
            weight: category.weight,
          }
        })
        .filter((c): c is { average: AverageResult; weight: number } => c !== null)
      return { average: subjectAverage(categoryAverages), weight: subject.weight ?? 1 }
    })

    const overall = overallAverage(subjectAverages)
    if (overall.value !== null && overall.scale !== null) {
      points.push({ date, average: overall.value, scale: overall.scale, score: performanceScore(overall.value, overall.scale) })
    }
  }
  return points
}

// ---------------------------------------------------------------------------
// Improvement over a period, reusing the history above.
// ---------------------------------------------------------------------------

export async function calculateOverallImprovement(
  entryFilter: (entry: GradeEntry) => boolean,
  sinceDate: string,
): Promise<PeriodImprovement | null> {
  const history = await calculatePerformanceHistory(entryFilter)
  return calculateImprovement(history, sinceDate)
}

// ---------------------------------------------------------------------------
// Notenarten — average per category *name*, aggregated across every subject
// that has a category with that exact name. Only names with real data show up.
// ---------------------------------------------------------------------------

export interface CategoryTypeAverage {
  name: string
  average: AverageResult
  entryCount: number
}

export async function calculateCategoryPerformance(entryFilter: (entry: GradeEntry) => boolean): Promise<CategoryTypeAverage[]> {
  const { categoriesById, entries } = await loadContext(entryFilter)

  const byName = new Map<string, GradeEntry[]>()
  for (const entry of entries) {
    const category = categoriesById.get(entry.categoryId)
    if (!category?.enabled) continue
    const list = byName.get(category.name) ?? []
    list.push(entry)
    byName.set(category.name, list)
  }

  return [...byName.entries()]
    .map(([name, catEntries]) => ({
      name,
      average: categoryAverage(catEntries.map((e) => ({ value: e.value, weight: e.weight ?? 1, scale: e.scale }))),
      entryCount: catEntries.length,
    }))
    .filter((c) => c.average.value !== null)
}

// ---------------------------------------------------------------------------
// Schriftlich vs. mündlich — only categories with an explicit categoryType.
// ---------------------------------------------------------------------------

export async function calculateWrittenVsOralStats(
  entryFilter: (entry: GradeEntry) => boolean,
): Promise<WrittenVsOralResult | null> {
  const { categoriesById, entries } = await loadContext(entryFilter)

  const written: { value: number; scale: GradingScale }[] = []
  const oral: { value: number; scale: GradingScale }[] = []
  for (const entry of entries) {
    const category = categoriesById.get(entry.categoryId)
    if (!category?.enabled) continue
    if (category.categoryType === 'written') written.push({ value: entry.value, scale: entry.scale })
    else if (category.categoryType === 'oral') oral.push({ value: entry.value, scale: entry.scale })
  }
  return calculateWrittenVsOral(written, oral)
}

// ---------------------------------------------------------------------------
// Consistency — overall, from the performance-score history above.
// ---------------------------------------------------------------------------

export async function calculateOverallConsistency(entryFilter: (entry: GradeEntry) => boolean): Promise<ConsistencyResult | null> {
  const history = await calculatePerformanceHistory(entryFilter)
  return calculateConsistency(history.map((p) => p.score))
}

// ---------------------------------------------------------------------------
// Recent entries — newest first, with subject/category names attached for display.
// ---------------------------------------------------------------------------

export interface RecentEntryView {
  entry: GradeEntry
  subjectName: string
  categoryName: string
}

export async function getRecentEntries(entryFilter: (entry: GradeEntry) => boolean, limit: number): Promise<RecentEntryView[]> {
  const { subjects, categoriesById, entries } = await loadContext(entryFilter)
  const subjectsById = new Map(subjects.map((s) => [s.id, s]))

  return entries
    .slice()
    .sort((a, b) => (b.date === a.date ? b.createdAt.localeCompare(a.createdAt) : b.date.localeCompare(a.date)))
    .slice(0, limit)
    .map((entry) => ({
      entry,
      subjectName: subjectsById.get(entry.subjectId)?.name ?? 'Unbekanntes Fach',
      categoryName: categoriesById.get(entry.categoryId)?.name ?? 'Unbekannte Kategorie',
    }))
}

// ---------------------------------------------------------------------------
// Activity — how many entries, broken down by category type.
// ---------------------------------------------------------------------------

export interface ActivityBreakdown {
  total: number
  byType: Record<CategoryType, number>
}

export async function calculateActivity(entryFilter: (entry: GradeEntry) => boolean): Promise<ActivityBreakdown> {
  const { categoriesById, entries } = await loadContext(entryFilter)
  const byType: Record<CategoryType, number> = { written: 0, oral: 0, presentation: 0, practical: 0, other: 0 }
  for (const entry of entries) {
    const type = categoriesById.get(entry.categoryId)?.categoryType ?? 'other'
    byType[type]++
  }
  return { total: entries.length, byType }
}

// ---------------------------------------------------------------------------
// Streak — subtle, factual read of the most recent results.
// ---------------------------------------------------------------------------

export interface StreakResult {
  aboveThreshold: number
  aboveRunningAverage: number
}

export async function calculateRecentStreak(entryFilter: (entry: GradeEntry) => boolean): Promise<StreakResult | null> {
  const history = await calculatePerformanceHistory(entryFilter)
  if (history.length < 2) return null
  const scores = history.map((p) => p.score)
  return {
    aboveThreshold: calculateStreakAboveThreshold(scores, 70),
    aboveRunningAverage: calculateStreakAboveRunningAverage(scores),
  }
}
