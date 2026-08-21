import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import type { AssessmentCategory, CategoryType, Subject } from '../../domain/types'
import { CATEGORY_TYPE_LABEL } from '../../domain/assessmentCategories'
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


interface CategoryRowProps {
  category: AssessmentCategory
  isFirst: boolean
  isLast: boolean
  onChanged: () => void
  onMove: (direction: -1 | 1) => void
}

function CategoryRow({ category, isFirst, isLast, onChanged, onMove }: CategoryRowProps) {
  const { showToast } = useToast()

  async function handleRename(name: string) {
    if (name.trim() === category.name || !name.trim()) return
    await renameCategory(category.id, name)
    onChanged()
  }

  async function handleWeight(value: string) {
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
    await setCategoryType(category.id, value as CategoryType)
    onChanged()
  }

  async function handleToggle(enabled: boolean) {
    await setCategoryEnabled(category.id, enabled)
    onChanged()
  }

  async function handleDelete() {
    if (!window.confirm(`„${category.name}“ inklusive aller enthaltenen Noten löschen?`)) return
    await deleteCategory(category.id)
    onChanged()
  }

  return (
    <Card className={category.enabled ? undefined : 'opacity-60'}>
      <div className="flex items-center gap-2">
        <input
          type="text"
          defaultValue={category.name}
          onBlur={(e) => handleRename(e.target.value)}
          aria-label="Kategoriename"
          className="min-w-0 flex-1 rounded-control border border-transparent bg-transparent px-2 py-1.5 text-sm font-semibold text-ink outline-none transition-colors hover:border-border focus:border-mint focus:bg-bg-raised"
        />
        <button
          type="button"
          onClick={handleDelete}
          aria-label={`${category.name} löschen`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-ink-faint transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-3 border-t border-border pt-2.5">
        <div className="flex shrink-0 flex-col">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => onMove(-1)}
            aria-label={`${category.name} nach oben verschieben`}
            className="flex h-5 w-5 items-center justify-center text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => onMove(1)}
            aria-label={`${category.name} nach unten verschieben`}
            className="flex h-5 w-5 items-center justify-center text-ink-faint transition-colors hover:text-ink disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-1 items-center gap-2">
          <span className="text-xs text-ink-faint">Gewichtung</span>
          <input
            type="number"
            min={0}
            step={1}
            defaultValue={category.weight}
            onBlur={(e) => handleWeight(e.target.value)}
            aria-label={`Gewichtung von ${category.name}`}
            className="w-14 rounded-control border border-border bg-bg-raised px-2 py-1.5 text-center text-sm text-ink outline-none transition-colors focus:border-mint"
          />
        </div>

        <Switch checked={category.enabled} onChange={handleToggle} label={`${category.name} aktiviert`} />
      </div>

      <div className="mt-2 flex items-center gap-2 border-t border-border pt-2.5">
        <span className="text-xs text-ink-faint">Art</span>
        <select
          value={category.categoryType ?? 'other'}
          onChange={(e) => handleType(e.target.value)}
          aria-label={`Art von ${category.name}`}
          className="min-w-0 flex-1 rounded-control border border-border bg-bg-raised px-2 py-1.5 text-sm text-ink outline-none transition-colors focus:border-mint"
        >
          {(Object.keys(CATEGORY_TYPE_LABEL) as CategoryType[]).map((type) => (
            <option key={type} value={type}>
              {CATEGORY_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
      </div>
    </Card>
  )
}

export function EinstellungenTab({ subject, categories, onChanged }: EinstellungenTabProps) {
  const [newName, setNewName] = useState('')
  const subjectId = subject.id

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

      <div className="space-y-3">
        {categories.map((category, index) => (
          <CategoryRow
            key={category.id}
            category={category}
            isFirst={index === 0}
            isLast={index === categories.length - 1}
            onChanged={onChanged}
            onMove={(direction) => handleMove(category, direction)}
          />
        ))}
      </div>

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
