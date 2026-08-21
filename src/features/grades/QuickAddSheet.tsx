import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AssessmentCategory, GradeEntry, GradingScale, Subject } from '../../domain/types'
import { getSchoolProfile } from '../../services/onboardingService'
import { subjectRepository } from '../../storage/repositories'
import { getCategoriesForSubject } from '../../services/categoryService'
import { createGradeEntry } from '../../services/gradeEntryService'
import { getSubjectAveragePreview, type SubjectAveragePreview } from '../../services/gradeStatsService'
import { Sheet } from '../../components/ui/Sheet'
import { Button } from '../../components/ui/Button'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { useToast } from '../../components/ui/toastContext'
import { useSemesterView } from '../app-shell/semesterView'
import { cn } from '../../utils/cn'
import { ValuePicker } from './ValuePicker'
import { AveragePreviewLine } from './AveragePreviewLine'

export interface QuickAddPrefill {
  subjectId?: string
  categoryId?: string
}

interface QuickAddSheetProps {
  open: boolean
  prefill?: QuickAddPrefill
  onClose: () => void
  onSaved?: () => void
}

const WEIGHT_OPTIONS = [1, 2, 3]

export function QuickAddSheet({ open, prefill, onClose, onSaved }: QuickAddSheetProps) {
  const { selectedSemesterId } = useSemesterView()
  const { showToast } = useToast()

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [scale, setScale] = useState<GradingScale | null>(null)
  const [categories, setCategories] = useState<AssessmentCategory[]>([])

  const [subjectId, setSubjectId] = useState<string | undefined>(prefill?.subjectId)
  const [categoryId, setCategoryId] = useState<string | undefined>(prefill?.categoryId)
  const [value, setValue] = useState<number | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [weight, setWeight] = useState(1)
  const [note, setNote] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<SubjectAveragePreview | null>(null)

  useEffect(() => {
    if (!open) return
    setSubjectId(prefill?.subjectId)
    setCategoryId(prefill?.categoryId)
    setValue(null)
    setShowDetails(false)
    setTitle('')
    setDate(new Date().toISOString().slice(0, 10))
    setWeight(1)
    setNote('')
    setError(null)
    setLoading(true)

    Promise.all([subjectRepository.getAll(), getSchoolProfile()]).then(([allSubjects, profile]) => {
      setSubjects(allSubjects.filter((s) => !s.archived))
      setScale(profile?.gradingScale ?? null)
      setLoading(false)
    })
  }, [open, prefill?.subjectId, prefill?.categoryId])

  useEffect(() => {
    if (!subjectId) {
      setCategories([])
      return
    }
    getCategoriesForSubject(subjectId).then((all) => setCategories(all.filter((c) => c.enabled)))
  }, [subjectId])

  const selectedSubject = useMemo(() => subjects.find((s) => s.id === subjectId), [subjects, subjectId])

  useEffect(() => {
    if (!selectedSubject || !categoryId || value === null || !selectedSemesterId || !scale) {
      setPreview(null)
      return
    }
    let active = true
    const candidate: GradeEntry = {
      id: '__preview__',
      subjectId: selectedSubject.id,
      categoryId,
      semesterId: selectedSemesterId,
      value,
      scale,
      weight,
      date,
      title: 'Vorschau',
      createdAt: '',
      updatedAt: '',
    }
    getSubjectAveragePreview(selectedSubject, selectedSemesterId, categoryId, (entries) => [
      ...entries,
      candidate,
    ]).then((p) => {
      if (active) setPreview(p)
    })
    return () => {
      active = false
    }
  }, [selectedSubject, categoryId, value, weight, selectedSemesterId, scale, date])

  async function handleSave() {
    if (!subjectId || !categoryId || value === null || !selectedSemesterId) return
    setSubmitting(true)
    setError(null)
    try {
      await createGradeEntry({
        subjectId,
        categoryId,
        semesterId: selectedSemesterId,
        value,
        weight,
        date,
        title: title.trim() || undefined,
        note: note.trim() || undefined,
      })
      showToast('Note gespeichert.', 'success')
      onSaved?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Note konnte nicht gespeichert werden.')
    } finally {
      setSubmitting(false)
    }
  }

  const canSave = !!subjectId && !!categoryId && value !== null && !submitting

  return (
    <Sheet open={open} onClose={onClose} title="Neue Note">
      {loading ? (
        <p className="py-6 text-center text-sm text-ink-soft">Lädt…</p>
      ) : (
        <div className="flex flex-col gap-5">
          {error && <ErrorBanner message={error} />}

          {!subjectId && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Fach</p>
              <div className="flex flex-wrap gap-2">
                {subjects.map((subject) => (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() => setSubjectId(subject.id)}
                    className="flex items-center gap-2 rounded-full border border-border bg-bg-raised px-3.5 py-2 text-sm font-medium text-ink-soft transition-all duration-200 hover:border-border-strong hover:text-ink active:scale-[0.97]"
                  >
                    <SubjectIcon iconKey={subject.icon} className="h-4 w-4" />
                    {subject.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {subjectId && selectedSubject && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-raised text-ink-soft">
                    <SubjectIcon iconKey={selectedSubject.icon} className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-semibold text-ink">{selectedSubject.name}</p>
                </div>
                {!prefill?.subjectId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSubjectId(undefined)
                      setCategoryId(undefined)
                    }}
                    className="text-xs font-medium text-ink-soft transition-colors hover:text-ink"
                  >
                    Ändern
                  </button>
                )}
              </div>

              {categories.length === 0 ? (
                <p className="text-sm text-ink-soft">
                  Für dieses Fach gibt es noch keine aktiven Kategorien.
                </p>
              ) : (
                <>
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

                  {categoryId && scale && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Wert</p>
                      <ValuePicker scale={scale} value={value} onChange={setValue} />
                      <AveragePreviewLine subjectName={selectedSubject.name} preview={preview} />
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => setShowDetails((s) => !s)}
                className="flex items-center gap-1 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
              >
                {showDetails ? (
                  <ChevronUp className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
                )}
                Details (optional)
              </button>

              {showDetails && (
                <div className="space-y-3 animate-fade-in">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bezeichnung, z. B. „1. Schulaufgabe“"
                    className="h-11 w-full rounded-control border border-border bg-bg-raised px-3.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-mint"
                  />
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
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
                    rows={2}
                    className="w-full resize-none rounded-control border border-border bg-bg-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-mint"
                  />
                </div>
              )}

              <Button size="lg" className="w-full" onClick={handleSave} disabled={!canSave}>
                {submitting ? 'Speichert…' : 'Speichern'}
              </Button>
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}
