import { useEffect, useState } from 'react'
import type { AssessmentCategory, GradeEntry, Subject } from '../../domain/types'
import { deleteGradeEntry, restoreGradeEntry, updateGradeEntry } from '../../services/gradeEntryService'
import { getSubjectAveragePreview, type SubjectAveragePreview } from '../../services/gradeStatsService'
import { Sheet } from '../../components/ui/Sheet'
import { Button } from '../../components/ui/Button'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { useToast } from '../../components/ui/toastContext'
import { cn } from '../../utils/cn'
import { ValuePicker } from './ValuePicker'
import { AveragePreviewLine } from './AveragePreviewLine'

const WEIGHT_OPTIONS = [1, 2, 3]

interface EditGradeSheetProps {
  entry: GradeEntry | null
  subject: Subject
  semesterId: string
  categories: AssessmentCategory[]
  onClose: () => void
  onChanged: () => void
}

export function EditGradeSheet({ entry, subject, semesterId, categories, onClose, onChanged }: EditGradeSheetProps) {
  const { showToast } = useToast()

  const [displayEntry, setDisplayEntry] = useState<GradeEntry | null>(entry)
  const [value, setValue] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState<string | undefined>()
  const [date, setDate] = useState('')
  const [weight, setWeight] = useState(1)
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<SubjectAveragePreview | null>(null)

  useEffect(() => {
    if (!entry) return
    setDisplayEntry(entry)
    setValue(entry.value)
    setCategoryId(entry.categoryId)
    setDate(entry.date)
    setWeight(entry.weight ?? 1)
    setTitle(entry.title)
    setNote(entry.note ?? '')
    setConfirmingDelete(false)
    setError(null)
  }, [entry])

  useEffect(() => {
    if (!displayEntry || value === null) {
      setPreview(null)
      return
    }
    let active = true
    getSubjectAveragePreview(subject, semesterId, displayEntry.categoryId, (entries) =>
      entries.map((e) => (e.id === displayEntry.id ? { ...e, value, weight } : e)),
    ).then((p) => {
      if (active) setPreview(p)
    })
    return () => {
      active = false
    }
  }, [subject, semesterId, displayEntry, value, weight])

  async function handleSave() {
    if (!displayEntry || value === null || !categoryId) return
    setSubmitting(true)
    setError(null)
    try {
      await updateGradeEntry(displayEntry.id, { value, categoryId, date, weight, title, note })
      showToast('Note aktualisiert.', 'success')
      onChanged()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Änderung konnte nicht gespeichert werden.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmedDelete() {
    if (!displayEntry) return
    setSubmitting(true)
    const deleted = await deleteGradeEntry(displayEntry.id)
    setSubmitting(false)
    onChanged()
    onClose()
    showToast(
      'Note gelöscht.',
      'info',
      deleted && {
        label: 'Rückgängig',
        onClick: async () => {
          await restoreGradeEntry(deleted)
          onChanged()
          showToast('Note wiederhergestellt.', 'success')
        },
      },
    )
  }

  if (!displayEntry) return null

  return (
    <Sheet open={!!entry} onClose={onClose} title="Note bearbeiten">
      <div className="flex flex-col gap-5">
        {error && <ErrorBanner message={error} />}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Wert</p>
          <ValuePicker scale={displayEntry.scale} value={value} onChange={setValue} />
          <AveragePreviewLine subjectName={subject.name} preview={preview} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Kategorie</p>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={cn(
                  'rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.97]',
                  categoryId === category.id
                    ? 'border-mint bg-mint-soft/40 text-ink'
                    : 'border-border bg-bg-raised text-ink-soft hover:border-border-strong hover:text-ink',
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bezeichnung"
          aria-label="Bezeichnung der Note"
          className="h-11 w-full rounded-control border border-border bg-bg-raised px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-mint"
        />

        <div className="flex gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            aria-label="Datum der Note"
            className="h-11 flex-1 rounded-control border border-border bg-bg-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-mint"
          />
          <div className="flex gap-1">
            {WEIGHT_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWeight(w)}
                className={cn(
                  'h-11 w-11 rounded-control border text-sm font-semibold transition-all duration-200',
                  weight === w
                    ? 'border-mint bg-mint-soft/40 text-ink'
                    : 'border-border bg-bg-raised text-ink-soft hover:border-border-strong',
                )}
              >
                {w}x
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Notiz (optional)"
          aria-label="Notiz zur Note"
          rows={2}
          className="w-full resize-none rounded-control border border-border bg-bg-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-mint"
        />

        {confirmingDelete ? (
          <div className="flex items-center gap-2 rounded-control border border-danger/30 bg-danger/10 p-3">
            <p className="flex-1 text-sm text-ink">Diese Note wirklich löschen?</p>
            <Button variant="ghost" size="md" onClick={() => setConfirmingDelete(false)} disabled={submitting}>
              Abbrechen
            </Button>
            <Button
              variant="secondary"
              size="md"
              className="border-danger text-danger hover:bg-danger/10"
              onClick={handleConfirmedDelete}
              disabled={submitting}
            >
              Löschen
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="lg"
              className="text-danger hover:bg-danger/10"
              onClick={() => setConfirmingDelete(true)}
              disabled={submitting}
            >
              Löschen
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={handleSave}
              disabled={submitting || value === null || !categoryId}
            >
              {submitting ? 'Speichert…' : 'Speichern'}
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  )
}
