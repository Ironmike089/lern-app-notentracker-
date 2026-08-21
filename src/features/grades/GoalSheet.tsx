import { useEffect, useRef, useState } from 'react'
import type { GradingScale, Subject, SubjectGoal } from '../../domain/types'
import { setGoal, clearGoal } from '../../services/subjectGoalService'
import { Sheet } from '../../components/ui/Sheet'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/ui/toastContext'
import { ValuePicker } from './ValuePicker'

interface GoalSheetProps {
  open: boolean
  onClose: () => void
  subject: Subject
  semesterId: string
  scale: GradingScale
  currentGoal: SubjectGoal | undefined
  onSaved: () => void
}

export function GoalSheet({ open, onClose, subject, semesterId, scale, currentGoal, onSaved }: GoalSheetProps) {
  const { showToast } = useToast()
  const [value, setValue] = useState<number | null>(currentGoal?.targetValue ?? null)
  const [submitting, setSubmitting] = useState(false)

  // Reset only on the closed→open transition, not on every `currentGoal`
  // reference change — an unrelated stats refetch elsewhere would otherwise
  // silently overwrite a value the user is still picking.
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open && !wasOpenRef.current) setValue(currentGoal?.targetValue ?? null)
    wasOpenRef.current = open
  }, [open, currentGoal])

  async function handleSave() {
    if (value === null) return
    setSubmitting(true)
    try {
      await setGoal(subject.id, semesterId, value)
      showToast('Ziel gespeichert.', 'success')
      onSaved()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  async function handleClear() {
    setSubmitting(true)
    try {
      await clearGoal(subject.id, semesterId)
      showToast('Ziel entfernt.', 'info')
      onSaved()
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Mein Ziel">
      <div className="flex flex-col gap-5">
        <p className="text-sm text-ink-soft">
          Welchen Schnitt möchtest du in {subject.name} {scale === 'points_0_15' ? 'mindestens erreichen' : 'erreichen'}?
        </p>
        <ValuePicker scale={scale} value={value} onChange={setValue} />
        <div className="flex gap-2">
          {currentGoal && (
            <Button variant="ghost" size="lg" onClick={handleClear} disabled={submitting} className="text-ink-faint">
              Ziel entfernen
            </Button>
          )}
          <Button size="lg" className="flex-1" onClick={handleSave} disabled={submitting || value === null}>
            {submitting ? 'Speichert…' : 'Ziel speichern'}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
