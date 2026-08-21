import { getSubjectIcon } from './subjectIconMap'

export function SubjectIcon({ iconKey, className }: { iconKey: string; className?: string }) {
  const Icon = getSubjectIcon(iconKey)
  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />
}
