import type { AssessmentCategory } from '../domain/types'
import { validateCategoryWeight } from '../domain/grading'
import { createId } from '../utils/id'
import { assessmentCategoryRepository, gradeEntryRepository } from '../storage/repositories'

export async function getCategoriesForSubject(subjectId: string): Promise<AssessmentCategory[]> {
  const all = await assessmentCategoryRepository.getAll()
  return all.filter((c) => c.subjectId === subjectId).sort((a, b) => a.sortOrder - b.sortOrder)
}

export async function createCategory(
  subjectId: string,
  name: string,
  weight = 1,
): Promise<AssessmentCategory> {
  const weightCheck = validateCategoryWeight(weight)
  if (!weightCheck.valid) throw new Error(weightCheck.error)

  const existing = await getCategoriesForSubject(subjectId)
  const category: AssessmentCategory = {
    id: createId(),
    subjectId,
    name: name.trim() || 'Kategorie',
    weight,
    enabled: true,
    sortOrder: existing.length,
  }
  await assessmentCategoryRepository.put(category)
  return category
}

export async function renameCategory(id: string, name: string): Promise<void> {
  const category = await assessmentCategoryRepository.getById(id)
  if (!category) return
  await assessmentCategoryRepository.put({ ...category, name: name.trim() || category.name })
}

export async function setCategoryWeight(id: string, weight: number): Promise<void> {
  const weightCheck = validateCategoryWeight(weight)
  if (!weightCheck.valid) throw new Error(weightCheck.error)
  const category = await assessmentCategoryRepository.getById(id)
  if (!category) return
  await assessmentCategoryRepository.put({ ...category, weight })
}

export async function setCategoryEnabled(id: string, enabled: boolean): Promise<void> {
  const category = await assessmentCategoryRepository.getById(id)
  if (!category) return
  await assessmentCategoryRepository.put({ ...category, enabled })
}

export async function reorderCategories(subjectId: string, orderedIds: string[]): Promise<void> {
  const categories = await getCategoriesForSubject(subjectId)
  const byId = new Map(categories.map((c) => [c.id, c]))
  const updates = orderedIds
    .map((id, index) => {
      const category = byId.get(id)
      return category ? { ...category, sortOrder: index } : null
    })
    .filter((c): c is AssessmentCategory => c !== null)
  await assessmentCategoryRepository.bulkPut(updates)
}

/** Deletes a category along with any grade entries recorded under it — orphaned entries would corrupt averages. */
export async function deleteCategory(id: string): Promise<void> {
  const allEntries = await gradeEntryRepository.getAll()
  const toDelete = allEntries.filter((e) => e.categoryId === id)
  await Promise.all(toDelete.map((e) => gradeEntryRepository.remove(e.id)))
  await assessmentCategoryRepository.remove(id)
}
