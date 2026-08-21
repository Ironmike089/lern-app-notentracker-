import type { Semester } from '../../domain/types'
import { renameSemester } from '../../services/schoolYearService'
import { Card } from '../../components/ui/Card'

interface SemesterManagerProps {
  semesters: Semester[]
  onRenamed: () => void
}

/** Kurshalbjahre-Bezeichnungen (z. B. Q1-Q4 oder 1./2. Halbjahr) sind bewusst frei editierbar — Schulmodelle variieren. */
export function SemesterManager({ semesters, onRenamed }: SemesterManagerProps) {
  if (semesters.length === 0) return null

  async function handleRename(id: string, label: string) {
    const semester = semesters.find((s) => s.id === id)
    if (!semester || label.trim() === semester.label || !label.trim()) return
    await renameSemester(id, label)
    onRenamed()
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-soft">Halbjahre</p>
      <Card className="space-y-2">
        {semesters.map((semester) => (
          <div key={semester.id} className="flex items-center gap-2">
            {semester.isCurrent && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint" aria-hidden="true" />}
            <input
              type="text"
              defaultValue={semester.label}
              onBlur={(e) => handleRename(semester.id, e.target.value)}
              aria-label={`Bezeichnung für ${semester.label}`}
              className="min-w-0 flex-1 rounded-control border border-transparent bg-transparent px-2 py-1.5 text-sm font-medium text-ink outline-none transition-colors hover:border-border focus:border-mint focus:bg-bg-raised"
            />
          </div>
        ))}
      </Card>
    </div>
  )
}
