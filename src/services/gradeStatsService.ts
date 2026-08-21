import type { AssessmentCategory, GradeEntry, GradingScale, Subject } from '../domain/types'
import {
  categoryAverage,
  isHigherBetter,
  overallAverage,
  performanceScore,
  performanceTierFromScore,
  subjectAverage,
  type AverageResult,
  type PerformanceTier,
} from '../domain/grading'
import { solveRequiredValue, type GoalSolverOutcome } from '../domain/goalSolver'
import { computeSubjectTrend, computeGradeDistribution, type DistributionBucket, type TrendPoint } from '../domain/analytics'
import { computeSubjectInsights, type Insight } from '../domain/insights'
import { assessmentCategoryRepository, gradeEntryRepository, subjectRepository } from '../storage/repositories'

export interface CategoryStats {
  category: AssessmentCategory
  entries: GradeEntry[]
  average: AverageResult
}

export interface SubjectStats {
  subject: Subject
  categories: CategoryStats[]
  average: AverageResult
  performanceScore: number | null
  performanceTier: PerformanceTier | null
  /** True when this subject's own entries/categories mix incompatible grading scales. */
  mixedScaleWarning: boolean
}

/**
 * Loads a subject's categories with whichever grade entries match
 * `entryFilter` — the semester-scoped call sites below just filter by
 * semesterId, but the same math powers the date-range views on the Analyse
 * page (whole school year, custom range) without duplicating any of it.
 */
async function loadCategoryStats(
  subjectId: string,
  entryFilter: (entry: GradeEntry) => boolean,
): Promise<CategoryStats[]> {
  const [allCategories, allEntries] = await Promise.all([
    assessmentCategoryRepository.getAll(),
    gradeEntryRepository.getAll(),
  ])

  const categories = allCategories
    .filter((c) => c.subjectId === subjectId)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return categories.map((category) => {
    const entries = allEntries
      .filter((e) => e.categoryId === category.id && entryFilter(e))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      category,
      entries,
      average: categoryAverage(
        entries.map((e) => ({ value: e.value, weight: e.weight ?? 1, scale: e.scale })),
      ),
    }
  })
}

function deriveScoreAndTier(average: AverageResult): {
  performanceScore: number | null
  performanceTier: PerformanceTier | null
} {
  if (average.value === null || average.scale === null) {
    return { performanceScore: null, performanceTier: null }
  }
  const score = performanceScore(average.value, average.scale)
  return { performanceScore: score, performanceTier: performanceTierFromScore(score) }
}

async function getSubjectStatsForFilter(
  subject: Subject,
  entryFilter: (entry: GradeEntry) => boolean,
): Promise<SubjectStats> {
  const categories = await loadCategoryStats(subject.id, entryFilter)
  const enabledCategories = categories.filter((c) => c.category.enabled)

  const average = subjectAverage(
    enabledCategories.map((c) => ({ average: c.average, weight: c.category.weight })),
  )

  const mixedScaleWarning = average.mixedScales || categories.some((c) => c.average.mixedScales)

  return {
    subject,
    categories,
    average,
    ...deriveScoreAndTier(average),
    mixedScaleWarning,
  }
}

export async function getSubjectStats(subject: Subject, semesterId: string): Promise<SubjectStats> {
  return getSubjectStatsForFilter(subject, (e) => e.semesterId === semesterId)
}

export interface OverallStats {
  average: AverageResult
  subjects: SubjectStats[]
  mixedScaleWarning: boolean
}

async function getOverallStatsForFilter(entryFilter: (entry: GradeEntry) => boolean): Promise<OverallStats> {
  const allSubjects = await subjectRepository.getAll()
  const activeSubjects = allSubjects.filter((s) => !s.archived)
  const subjectStats = await Promise.all(
    activeSubjects.map((s) => getSubjectStatsForFilter(s, entryFilter)),
  )

  const average = overallAverage(
    subjectStats.map((s) => ({ average: s.average, weight: s.subject.weight ?? 1 })),
  )
  const mixedScaleWarning = average.mixedScales || subjectStats.some((s) => s.mixedScaleWarning)

  return { average, subjects: subjectStats, mixedScaleWarning }
}

export async function getOverallStats(semesterId: string): Promise<OverallStats> {
  return getOverallStatsForFilter((e) => e.semesterId === semesterId)
}

/** Powers the Analyse page's "gesamtes Schuljahr" / "eigener Zeitraum" views. */
export async function getOverallStatsForSemesters(semesterIds: string[]): Promise<OverallStats> {
  const idSet = new Set(semesterIds)
  return getOverallStatsForFilter((e) => idSet.has(e.semesterId))
}

export async function getOverallStatsForDateRange(from: string, to: string): Promise<OverallStats> {
  return getOverallStatsForFilter((e) => e.date >= from && e.date <= to)
}

// ---------------------------------------------------------------------------
// Live preview & trend — pure composition of the existing engine exports
// (categoryAverage / subjectAverage / overallAverage). No engine changes.
// ---------------------------------------------------------------------------

export interface SubjectAveragePreview {
  before: AverageResult
  after: AverageResult
}

/**
 * "If I saved this, what would the subject average become?" — recomputes
 * only the one affected category, keeping every other category's already-
 * computed average untouched, then re-runs subjectAverage over all of them.
 */
export async function getSubjectAveragePreview(
  subject: Subject,
  semesterId: string,
  categoryId: string,
  transformCategoryEntries: (entries: GradeEntry[]) => GradeEntry[],
): Promise<SubjectAveragePreview> {
  const categories = await loadCategoryStats(subject.id, (e) => e.semesterId === semesterId)
  const enabledCategories = categories.filter((c) => c.category.enabled)

  const before = subjectAverage(
    enabledCategories.map((c) => ({ average: c.average, weight: c.category.weight })),
  )

  const after = subjectAverage(
    enabledCategories.map((c) => {
      if (c.category.id !== categoryId) return { average: c.average, weight: c.category.weight }
      const transformed = transformCategoryEntries(c.entries)
      const average = categoryAverage(
        transformed.map((e) => ({ value: e.value, weight: e.weight ?? 1, scale: e.scale })),
      )
      return { average, weight: c.category.weight }
    }),
  )

  return { before, after }
}

export interface OverallTrend {
  /** Signed change in scale units caused by the most recently added grade entry. */
  delta: number
  /** Whether that change was an improvement, direction-aware per scale (lower is better for grades, higher for points). */
  improved: boolean
  scale: AverageResult['scale']
}

/**
 * How much the overall average moved because of the single most recently
 * added grade entry (across all active subjects, this semester) — i.e. "since
 * your last entered grade". Returns null when there's no entry to compare,
 * or when before/after can't be honestly compared (e.g. a scale conflict).
 */
export async function getOverallTrend(semesterId: string): Promise<OverallTrend | null> {
  const allSubjects = await subjectRepository.getAll()
  const activeSubjects = allSubjects.filter((s) => !s.archived)
  if (activeSubjects.length === 0) return null

  const allEntries = await gradeEntryRepository.getAll()
  const activeSubjectIds = new Set(activeSubjects.map((s) => s.id))
  const semesterEntries = allEntries.filter(
    (e) => e.semesterId === semesterId && activeSubjectIds.has(e.subjectId),
  )
  if (semesterEntries.length === 0) return null

  const mostRecent = semesterEntries.reduce((a, b) => (a.createdAt > b.createdAt ? a : b))
  const mostRecentSubject = activeSubjects.find((s) => s.id === mostRecent.subjectId)
  if (!mostRecentSubject) return null

  const afterStats = await Promise.all(activeSubjects.map((s) => getSubjectStats(s, semesterId)))
  const afterOverall = overallAverage(
    afterStats.map((s) => ({ average: s.average, weight: s.subject.weight ?? 1 })),
  )

  const beforeAverages = await Promise.all(
    activeSubjects.map(async (s, i) => {
      if (s.id !== mostRecentSubject.id) return afterStats[i].average
      // `after` here means "with mostRecent filtered out" — i.e. the state
      // the subject was in right before that entry was added.
      const preview = await getSubjectAveragePreview(s, semesterId, mostRecent.categoryId, (entries) =>
        entries.filter((e) => e.id !== mostRecent.id),
      )
      return preview.after
    }),
  )
  const beforeOverall = overallAverage(
    beforeAverages.map((average, i) => ({ average, weight: activeSubjects[i].weight ?? 1 })),
  )

  if (
    afterOverall.value === null ||
    afterOverall.scale === null ||
    beforeOverall.value === null ||
    beforeOverall.scale === null ||
    beforeOverall.scale !== afterOverall.scale
  ) {
    return null
  }

  const delta = afterOverall.value - beforeOverall.value
  if (delta === 0) return null

  const improved = isHigherBetter(afterOverall.scale) ? delta > 0 : delta < 0

  return { delta, improved, scale: afterOverall.scale }
}

// ---------------------------------------------------------------------------
// Goal solver — "Was brauche ich?"
// ---------------------------------------------------------------------------

/**
 * Wraps domain/goalSolver.ts with real subject data: every other enabled
 * category's already-computed average/weight, plus the target category's
 * raw entries so the solver can fold in its existing weighted sum.
 */
export async function getRequiredValueForTarget(
  subject: Subject,
  semesterId: string,
  targetCategoryId: string,
  targetSubjectAverage: number,
  scale: GradingScale,
): Promise<GoalSolverOutcome | null> {
  const categories = await loadCategoryStats(subject.id, (e) => e.semesterId === semesterId)
  const targetCategory = categories.find((c) => c.category.id === targetCategoryId && c.category.enabled)
  if (!targetCategory) return null

  const others = categories
    .filter((c) => c.category.enabled && c.category.id !== targetCategoryId)
    .map((c) => ({ weight: c.category.weight, average: c.average }))

  return solveRequiredValue(
    others,
    {
      weight: targetCategory.category.weight,
      entries: targetCategory.entries.map((e) => ({ value: e.value, weight: e.weight ?? 1 })),
    },
    targetSubjectAverage,
    scale,
  )
}

// ---------------------------------------------------------------------------
// Trend series & distribution — per subject
// ---------------------------------------------------------------------------

export async function getSubjectTrendSeries(subject: Subject, semesterId: string): Promise<TrendPoint[]> {
  const categories = await loadCategoryStats(subject.id, (e) => e.semesterId === semesterId)
  const trendEntries = categories.flatMap((c) =>
    c.entries.map((e) => ({
      categoryId: c.category.id,
      categoryWeight: c.category.weight,
      value: e.value,
      weight: e.weight ?? 1,
      scale: e.scale,
      date: e.date,
    })),
  )
  return computeSubjectTrend(trendEntries)
}

export async function getSubjectDistribution(subject: Subject, semesterId: string): Promise<{
  buckets: DistributionBucket[]
  scale: AverageResult['scale']
} | null> {
  const categories = await loadCategoryStats(subject.id, (e) => e.semesterId === semesterId)
  const entries = categories.flatMap((c) => c.entries)
  if (entries.length === 0) return null
  const scale = entries[0].scale
  if (entries.some((e) => e.scale !== scale)) return null
  return { buckets: computeGradeDistribution(entries.map((e) => e.value), scale), scale }
}

/** Date-range counterpart to getSubjectStats — powers per-subject "most improved" comparisons on the Analyse page. */
export async function getSubjectStatsForDateRange(subject: Subject, from: string, to: string): Promise<SubjectStats> {
  return getSubjectStatsForFilter(subject, (e) => e.date >= from && e.date <= to)
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export async function getSubjectInsights(subject: Subject, semesterId: string): Promise<Insight[]> {
  const categories = await loadCategoryStats(subject.id, (e) => e.semesterId === semesterId)
  return computeSubjectInsights(
    subject.name,
    categories.map((c) => ({
      id: c.category.id,
      name: c.category.name,
      weight: c.category.weight,
      categoryType: c.category.categoryType,
      entries: c.entries.map((e) => ({ value: e.value, weight: e.weight ?? 1, scale: e.scale, date: e.date })),
    })),
  )
}
