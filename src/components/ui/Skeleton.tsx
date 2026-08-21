import { cn } from '../../utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Lädt…"
      className={cn('animate-pulse rounded-control bg-bg-card-hover', className)}
    />
  )
}
