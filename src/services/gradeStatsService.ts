import type { AssessmentCategory, GradeEntry, Subject } from '../domain/types'
import {
  categoryAverage,
  overallAverage,
  performanceScore,
  performanceTierFromScore,
  subjectAverage,
  type AverageResult,
  type PerformanceTier,
} from '../domain/grading'
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

async function loadCategoryStats(subjectId: string, semesterId: string): Promise<CategoryStats[]> {
  const [allCategories, allEntries] = await Promise.all([
    assessmentCategoryRepository.getAll(),
    gradeEntryRepository.getAll(),
  ])

  const categories = allCategories
    .filter((c) => c.subjectId === subjectId)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return categories.map((category) => {
    const entries = allEntries
      .filter((e) => e.categoryId === category.id && e.semesterId === semesterId)
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

export async function getSubjectStats(subject: Subject, semesterId: string): Promise<SubjectStats> {
  const categories = await loadCategoryStats(subject.id, semesterId)
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

export interface OverallStats {
  average: AverageResult
  subjects: SubjectStats[]
  mixedScaleWarning: boolean
}

export async function getOverallStats(semesterId: string): Promise<OverallStats> {
  const allSubjects = await subjectRepository.getAll()
  const activeSubjects = allSubjects.filter((s) => !s.archived)
  const subjectStats = await Promise.all(activeSubjects.map((s) => getSubjectStats(s, semesterId)))

  const average = overallAverage(subjectStats.map((s) => ({ average: s.average, weight: 1 })))
  const mixedScaleWarning = average.mixedScales || subjectStats.some((s) => s.mixedScaleWarning)

  return { average, subjects: subjectStats, mixedScaleWarning }
}
