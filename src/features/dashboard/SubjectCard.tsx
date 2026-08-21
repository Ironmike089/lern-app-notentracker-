import type { Subject } from '../../domain/types'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { Card } from '../../components/ui/Card'

export function SubjectCard({ subject }: { subject: Subject }) {
  return (
    <Card className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-bg-raised text-ink-soft">
        <SubjectIcon iconKey={subject.icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{subject.name}</p>
        <p className="text-xs text-ink-faint">Noch keine Noten</p>
      </div>
      <span className="h-2 w-2 shrink-0 rounded-full bg-border-strong" aria-hidden="true" />
    </Card>
  )
}
