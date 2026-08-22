import { useState } from 'react'
import { Check, ChevronDown, ChevronRight, ChevronUp, Plus, Trash2 } from 'lucide-react'
import type { AssessmentCategory, CategoryType, Subject } from '../../domain/types'
import { CATEGORY_TYPE_LABEL } from '../../domain/assessmentCategories'
import { formatNumberDe } from '../../domain/grading'
import { SUBJECT_COLOR_KEYS, getSubjectColorKey, subjectColorVar, type SubjectColorKey } from '../../domain/subjectColors'
import {
  createCategory,
  deleteCategory,
  renameCategory,
  reorderCategories,
  setCategoryEnabled,
  setCategoryType,
  setCategoryWeight,
} from '../../services/categoryService'
import { setSubjectColor, setSubjectWeight } from '../../services/subjectService'
import { Card } from '../../components/ui/Card'
import { Switch } from '../../components/ui/Switch'
import { Button } from '../../components/ui/Button'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/toastContext'

interface EinstellungenTabProps {
  subject: Subject
  categories: AssessmentCategory[]
  onChanged: () => void
}

function ColorPickerControl({
  subjectId,
  subjectName,
  currentKey,
  onChanged,
}: {
  subjectId: string
  subjectName: string
  currentKey: SubjectColorKey
  onChanged: () => void
}) {
  const { showToast } = useToast()

  async function handlePick(key: SubjectColorKey) {
    if (key === currentKey) return
    try {
      await setSubjectColor(subjectId, key)
      onChanged()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Farbe konnte nicht geändert werden.', 'error')
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-soft">Fachfarbe</p>
      <Card>
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Fachfarbe von ${subjectName} wählen`}>
          {SUBJECT_COLOR_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => handlePick(key)}
              aria-label={`Farbe ${key}`}
              aria-pressed={key === currentKey}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
              style={{ backgroundColor: subjectColorVar(key) }}
            >
              {key === currentKey && <Check className="h-4 w-4 text-white drop-shadow" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

function CourseWeightControl({
  subjectId,
  subjectName,
  weight,
  onChanged,
}: {
  subjectId: string
  subjectName: string
  weight: number
  onChanged: () => void
}) {
  const { showToast } = useToast()

  async function handleChange(value: string) {
    const next = Number(value)
    if (!Number.isFinite(next) || next === weight) return
    try {
      await setSubjectWeight(subjectId, next)
      onChanged()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gewichtung ungültig.', 'error')
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-soft">Kursgewichtung</p>
      <Card className="flex items-center justify-between gap-3">
        <p className="text-xs text-ink-faint">
          Fließt in deinen Gesamtschnitt ein — keine offizielle Vorgabe für dein Bundesland, nur deine eigene Einstellung.
        </p>
        <input
          type="number"
          min={0}
          step={1}
          defaultValue={weight}
          onBlur={(e) => handleChange(e.target.value)}
          aria-label={`Kursgewichtung von ${subjectName}`}
          className="w-14 shrink-0 rounded-control border border-border bg-bg-raised px-2 py-1.5 text-center text-sm text-ink outline-none transition-colors focus:border-mint"
        />
      </Card>
    </div>
  )
}


/** Compact single-line row for the list — tap opens CategoryDetailSheet for everything else. */
function CompactCategoryRow({ category, onOpen }: { category: AssessmentCategory; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={
        'flex w-full items-center gap-3 rounded-card border border-border bg-bg-card px-4 py-3 text-left transition-colors duration-200 hover:bg-bg-card-hover' +
        (category.enabled ? '' : ' opacity-60')
      }
    >
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{category.name}</span>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-ink-soft">
        {formatNumberDe(category.weight, category.weight % 1 === 0 ? 0 : 1)}×
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-ink-faint" strokeWidth={2} />
    </button>
  )
}

interface CategoryDetailSheetProps {
  category: AssessmentCategory | null
  isFirst: boolean
  isLast: boolean
  onClose: () => void
  onChanged: () => void
  onMove: (direction: -1 | 1) => void
}

function CategoryDetailSheet({ category, isFirst, isLast, onClose, onChanged, onMove }: CategoryDetailSheetProps) {
  const { showToast } = useToast()

  async function handleRename(name: string) {
    if (!category || name.trim() === category.name || !name.trim()) return
    await renameCategory(category.id, name)
    onChanged()
  }

  async function handleWeight(value: string) {
    if (!category) return
    const weight = Number(value)
    if (!Number.isFinite(weight) || weight === category.weight) return
    try {
      await setCategoryWeight(category.id, weight)
      onChanged()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gewichtung ungültig.', 'error')
    }
  }

  async function handleType(value: string) {
    if (!category) return
    await setCategoryType(category.id, value as CategoryType)
    onChanged()
  }

  async function handleToggle(enabled: boolean) {
    if (!category) return
    await setCategoryEnabled(category.id, enabled)
    onChanged()
  }

  async function handleDelete() {
    if (!category) return
    if (!window.confirm(`„${category.name}“ inklusive aller enthaltenen Noten löschen?`)) return
    await deleteCategory(category.id)
    onChanged()
    onClose()
  }

  return (
    <Sheet open={!!category} onClose={onClose} title="Kategorie">
      {category && (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Name</label>
          <input
            type="text"
            key={category.id}
            defaultValue={category.name}
            onBlur={(e) => handleRename(e.target.value)}
            aria-label="Kategoriename"
            className="h-11 w-full rounded-control border border-border bg-bg-raised px-3.5 text-sm font-semibold text-ink outline-none transition-colors focus:border-mint"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Art</label>
          <select
            value={category.categoryType ?? 'other'}
            onChange={(e) => handleType(e.target.value)}
            aria-label={`Art von ${category.name}`}
            className="h-11 w-full rounded-control border border-border bg-bg-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-mint"
          >
            {(Object.keys(CATEGORY_TYPE_LABEL) as CategoryType[]).map((type) => (
              <option key={type} value={type}>
                {CATEGORY_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </div>

        <Card className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink">Gewichtung</span>
          <input
            type="number"
            min={0}
            step={1}
            key={category.id}
            defaultValue={category.weight}
            onBlur={(e) => handleWeight(e.target.value)}
            aria-label={`Gewichtung von ${category.name}`}
            className="w-16 shrink-0 rounded-control border border-border bg-bg-card px-2 py-1.5 text-center text-sm text-ink outline-none transition-colors focus:border-mint"
          />
        </Card>

        <Card className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink">Aktiviert</span>
          <Switch checked={category.enabled} onChange={handleToggle} label={`${category.name} aktiviert`} />
        </Card>

        <Card className="flex items-center justify-between gap-3">
          <span className="text-sm text-ink">Reihenfolge</span>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              disabled={isFirst}
              onClick={() => onMove(-1)}
              aria-label={`${category.name} nach oben verschieben`}
              className="flex h-8 w-8 items-center justify-center rounded-control text-ink-faint transition-colors hover:bg-bg-raised hover:text-ink disabled:opacity-30"
            >
              <ChevronUp className="h-4 w-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              disabled={isLast}
              onClick={() => onMove(1)}
              aria-label={`${category.name} nach unten verschieben`}
              className="flex h-8 w-8 items-center justify-center rounded-control text-ink-faint transition-colors hover:bg-bg-raised hover:text-ink disabled:opacity-30"
            >
              <ChevronDown className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
        </Card>

        <Button variant="ghost" size="md" className="w-full text-danger hover:bg-danger/10" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" strokeWidth={2} />
          Kategorie löschen
        </Button>
      </div>
      )}
    </Sheet>
  )
}

export function EinstellungenTab({ subject, categories, onChanged }: EinstellungenTabProps) {
  const [newName, setNewName] = useState('')
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null)
  const subjectId = subject.id
  const editingCategory = categories.find((c) => c.id === editingCategoryId) ?? null
  const editingIndex = editingCategory ? categories.findIndex((c) => c.id === editingCategory.id) : -1

  async function handleMove(category: AssessmentCategory, direction: -1 | 1) {
    const ids = categories.map((c) => c.id)
    const index = ids.indexOf(category.id)
    const swapWith = index + direction
    if (swapWith < 0 || swapWith >= ids.length) return
    ;[ids[index], ids[swapWith]] = [ids[swapWith], ids[index]]
    await reorderCategories(subjectId, ids)
    onChanged()
  }

  async function handleAddCategory() {
    const name = newName.trim()
    if (!name) return
    await createCategory(subjectId, name)
    setNewName('')
    onChanged()
  }

  return (
    <div className="space-y-5">
      <ColorPickerControl
        subjectId={subjectId}
        subjectName={subject.name}
        currentKey={getSubjectColorKey(subject)}
        onChanged={onChanged}
      />

      <CourseWeightControl
        subjectId={subjectId}
        subjectName={subject.name}
        weight={subject.weight ?? 1}
        onChanged={onChanged}
      />

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-soft">Notengruppen</p>
        <div className="space-y-2">
          {categories.map((category) => (
            <CompactCategoryRow key={category.id} category={category} onOpen={() => setEditingCategoryId(category.id)} />
          ))}
        </div>
      </div>

      <CategoryDetailSheet
        category={editingCategory}
        isFirst={editingIndex === 0}
        isLast={editingIndex === categories.length - 1}
        onClose={() => setEditingCategoryId(null)}
        onChanged={onChanged}
        onMove={(direction) => editingCategory && handleMove(editingCategory, direction)}
      />

      <div className="flex gap-2 pt-1">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAddCategory()
            }
          }}
          placeholder="Neue Kategorie, z. B. Projektarbeit"
          aria-label="Name der neuen Kategorie"
          className="h-11 flex-1 rounded-control border border-border bg-bg-raised px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-mint"
        />
        <Button type="button" variant="secondary" onClick={handleAddCategory} aria-label="Kategorie hinzufügen">
          <Plus className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>
    </div>
  )
}
