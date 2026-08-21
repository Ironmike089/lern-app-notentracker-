import { useEffect, useMemo, useRef, useState } from 'react'
import type { AssessmentCategory, GradingScale, Subject, SubjectGoal } from '../../domain/types'
import { formatGradeValue } from '../../domain/grading'
import { getRequiredValueForTarget } from '../../services/gradeStatsService'
import type { GoalSolverOutcome } from '../../domain/goalSolver'
import { Sheet } from '../../components/ui/Sheet'
import { cn } from '../../utils/cn'
import { ValuePicker } from './ValuePicker'

interface GoalSolverSheetProps {
  open: boolean
  onClose: () => void
  subject: Subject
  semesterId: string
  scale: GradingScale
  categories: AssessmentCategory[]
  currentGoal: SubjectGoal | undefined
}

function resultMessage(outcome: GoalSolverOutcome, categoryName: string, scale: GradingScale, target: number): string {
  const targetLabel = formatGradeValue(target, scale)
  switch (outcome.kind) {
    case 'achievable':
      return `Für einen Schnitt von ${targetLabel} bräuchtest du in „${categoryName}“ ungefähr eine ${formatGradeValue(outcome.requiredValue, scale)}.`
    case 'unreachable':
      return `Mit nur einer weiteren Leistung ist ${targetLabel} aktuell nicht erreichbar.`
    case 'already-guaranteed':
      return `Dein Ziel von ${targetLabel} ist bereits gesichert — unabhängig davon, welche Note als Nächstes in „${categoryName}“ dazukommt.`
    case 'no-influence':
      return `„${categoryName}“ hat aktuell keine Gewichtung — eine neue Note dort verändert deinen Schnitt nicht.`
  }
}

export function GoalSolverSheet({
  open,
  onClose,
  subject,
  semesterId,
  scale,
  categories,
  currentGoal,
}: GoalSolverSheetProps) {
  const enabledCategories = useMemo(() => categories.filter((c) => c.enabled), [categories])
  const [target, setTarget] = useState<number | null>(currentGoal?.targetValue ?? null)
  const [categoryId, setCategoryId] = useState<string | undefined>(enabledCategories[0]?.id)
  const [outcome, setOutcome] = useState<GoalSolverOutcome | null>(null)
  const [loading, setLoading] = useState(false)

  // Reset defaults only on the closed→open transition, not on every render
  // while already open — the `categories`/`currentGoal` props are recreated
  // by the parent on unrelated re-renders (e.g. a stats refetch elsewhere),
  // and resetting on every such reference change would wipe an
  // already-computed result out from under the user.
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setTarget(currentGoal?.targetValue ?? null)
      setCategoryId(enabledCategories[0]?.id)
      setOutcome(null)
    }
    wasOpenRef.current = open
  }, [open, currentGoal, enabledCategories])

  useEffect(() => {
    if (target === null || !categoryId) {
      setOutcome(null)
      return
    }
    let active = true
    setLoading(true)
    getRequiredValueForTarget(subject, semesterId, categoryId, target, scale).then((result) => {
      if (active) {
        setOutcome(result)
        setLoading(false)
      }
    })
    return () => {
      active = false
    }
  }, [subject, semesterId, categoryId, target, scale])

  const selectedCategory = enabledCategories.find((c) => c.id === categoryId)

  return (
    <Sheet open={open} onClose={onClose} title="Was brauche ich?">
      <div className="flex flex-col gap-5">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Ziel</p>
          <ValuePicker scale={scale} value={target} onChange={setTarget} />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Die nächste Leistung ist eine…
          </p>
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

        {!loading && outcome && target !== null && selectedCategory && (
          <div
            className={cn(
              'rounded-card border p-4 text-sm animate-fade-in',
              outcome.kind === 'unreachable'
                ? 'border-perf-warning/30 bg-perf-warning/10 text-perf-warning'
                : 'border-border bg-bg-raised text-ink',
            )}
          >
            {resultMessage(outcome, selectedCategory.name, scale, target)}
          </div>
        )}
      </div>
    </Sheet>
  )
}
