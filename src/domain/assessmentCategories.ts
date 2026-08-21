import type { AssessmentCategory } from './types'

/**
 * Starting point for a newly created subject. Purely a convenience default —
 * NOT a legally binding weighting. Every category (name, weight, enabled
 * state, order) remains fully user-editable afterwards.
 */
export const DEFAULT_CATEGORY_NAMES = [
  'Schulaufgaben',
  'Kurzarbeiten',
  'Mündlich',
  'Referate',
  'Sonstige Leistungen',
] as const

export function buildDefaultCategories(
  subjectId: string,
  createId: () => string,
): AssessmentCategory[] {
  return DEFAULT_CATEGORY_NAMES.map((name, index) => ({
    id: createId(),
    subjectId,
    name,
    weight: 1,
    enabled: true,
    sortOrder: index,
  }))
}
