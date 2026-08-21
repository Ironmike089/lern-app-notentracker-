import { useEffect, useMemo, useRef, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { AssessmentCategory, GradeEntry, GradingScale, Subject } from '../../domain/types'
import { formatGradeValue, isHigherBetter } from '../../domain/grading'
import { getSubjectAveragePreview, type SubjectAveragePreview } from '../../services/gradeStatsService'
import { createGradeEntry } from '../../services/gradeEntryService'
import { Sheet } from '../../components/ui/Sheet'
import { Button } from '../../components/ui/Button'
import { ErrorBanner } from '../../components/ui/ErrorBanner'
import { useToast } from '../../components/ui/toastContext'
import { cn } from '../../utils/cn'
import { ValuePicker } from './ValuePicker'

interface SimulateGradeSheetProps {
  open: boolean
  onClose: () => void
  subject: Subject
  semesterId: string
  scale: GradingScale
  categories: AssessmentCategory[]
  onCommitted: () => void
}

/**
 * Dedicated "Was wäre wenn?" flow: try a hypothetical value against any
 * category and see Aktuell/Danach/Differenz, entirely temporary until the
 * user explicitly taps "Note übernehmen" — closing or backing out never
 * saves anything.
 */
export function SimulateGradeSheet({
  open,
  onClose,
  subject,
  semesterId,
  scale,
  categories,
  onCommitted,
}: SimulateGradeSheetProps) {
  const { showToast } = useToast()
  const enabledCategories = useMemo(() => categories.filter((c) => c.enabled), [categories])

  const [categoryId, setCategoryId] = useState<string | undefined>(enabledCategories[0]?.id)
  const [value, setValue] = useState<number | null>(null)
  const [preview, setPreview] = useState<SubjectAveragePreview | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset defaults only on the closed→open transition — see GoalSolverSheet
  // for why resetting on every `enabledCategories` reference change (which
  // happens on unrelated parent re-renders) would be wrong here too.
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setCategoryId(enabledCategories[0]?.id)
      setValue(null)
      setPreview(null)
      setError(null)
    }
    wasOpenRef.current = open
  }, [open, enabledCategories])

  useEffect(() => {
    if (!categoryId || value === null) {
      setPreview(null)
      return
    }
    let active = true
    const candidate: GradeEntry = {
      id: '__simulation__',
      subjectId: subject.id,
      categoryId,
      semesterId,
      value,
      scale,
      weight: 1,
      date: new Date().toISOString().slice(0, 10),
      title: 'Simulation',
      createdAt: '',
      updatedAt: '',
    }
    getSubjectAveragePreview(subject, semesterId, categoryId, (entries) => [...entries, candidate]).then((p) => {
      if (active) setPreview(p)
    })
    return () => {
      active = false
    }
  }, [subject, semesterId, categoryId, value, scale])

  async function handleCommit() {
    if (!categoryId || value === null) return
    setSubmitting(true)
    setError(null)
    try {
      await createGradeEntry({ subjectId: subject.id, categoryId, semesterId, value })
      showToast('Note übernommen.', 'success')
      onCommitted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Note konnte nicht übernommen werden.')
    } finally {
      setSubmitting(false)
    }
  }

  const hasResult = preview && preview.after.value !== null && preview.after.scale !== null
  const improved =
    hasResult && preview.before.value !== null && preview.before.scale !== null
      ? isHigherBetter(preview.after.scale as GradingScale)
        ? (preview.after.value as number) > preview.before.value
        : (preview.after.value as number) < preview.before.value
      : null

  return (
    <Sheet open={open} onClose={onClose} title="Note simulieren">
      <div className="flex flex-col gap-5">
        {error && <ErrorBanner message={error} />}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Kategorie</p>
          <div className="flex flex-wrap gap-2">
            {enabledCategories.map((category) => (
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

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Angenommene Note</p>
          <ValuePicker scale={scale} value={value} onChange={setValue} />
        </div>

        {hasResult && preview && (
          <div className="grid grid-cols-3 gap-2 rounded-card border border-border bg-bg-raised p-4 animate-fade-in">
            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Aktuell</p>
              <p className="mt-1 text-lg font-bold text-ink tabular-nums">
                {preview.before.value !== null && preview.before.scale !== null
                  ? formatGradeValue(preview.before.value, preview.before.scale)
                  : '–'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Danach</p>
              <p className="mt-1 text-lg font-bold text-ink tabular-nums">
                {formatGradeValue(preview.after.value as number, preview.after.scale as GradingScale)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">Differenz</p>
              <p
                className={cn(
                  'mt-1 flex items-center justify-center gap-1 text-lg font-bold tabular-nums',
                  improved === true && 'text-perf-excellent',
                  improved === false && 'text-perf-warning',
                )}
              >
                {improved !== null &&
                  (improved ? (
                    <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <TrendingDown className="h-4 w-4" strokeWidth={2.5} />
                  ))}
                {preview.before.value !== null
                  ? formatGradeValue(
                      Math.abs((preview.after.value as number) - preview.before.value),
                      preview.after.scale as GradingScale,
                    )
                  : '–'}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-ink-faint">
          Diese Note ist erst gespeichert, wenn du auf „Note übernehmen“ tippst.
        </p>

        <Button
          size="lg"
          className="w-full"
          onClick={handleCommit}
          disabled={submitting || !categoryId || value === null}
        >
          {submitting ? 'Wird übernommen…' : 'Note übernehmen'}
        </Button>
      </div>
    </Sheet>
  )
}
