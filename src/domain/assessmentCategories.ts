import type { AssessmentCategory, CategoryType } from './types'

/**
 * Starting point for a newly created subject. Purely a convenience default —
 * NOT a legally binding weighting. Every category (name, weight, enabled
 * state, order, type) remains fully user-editable afterwards. The type here
 * is a known fact about *our own* default set, not a guess from the name —
 * user-created categories never get a type inferred this way.
 */
export const DEFAULT_CATEGORIES: { name: string; categoryType: CategoryType }[] = [
  { name: 'Schulaufgaben', categoryType: 'written' },
  { name: 'Kurzarbeiten', categoryType: 'written' },
  { name: 'Mündlich', categoryType: 'oral' },
  { name: 'Referate', categoryType: 'presentation' },
  { name: 'Sonstige Leistungen', categoryType: 'other' },
]

export const DEFAULT_CATEGORY_NAMES = DEFAULT_CATEGORIES.map((c) => c.name)

export const CATEGORY_TYPE_LABEL: Record<CategoryType, string> = {
  written: 'Schriftlich',
  oral: 'Mündlich',
  presentation: 'Referat',
  practical: 'Praktisch',
  other: 'Sonstiges',
}

export function buildDefaultCategories(
  subjectId: string,
  createId: () => string,
): AssessmentCategory[] {
  return DEFAULT_CATEGORIES.map(({ name, categoryType }, index) => ({
    id: createId(),
    subjectId,
    name,
    weight: 1,
    enabled: true,
    sortOrder: index,
    categoryType,
  }))
}
