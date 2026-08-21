import type { DistributionBucket } from '../../domain/analytics'

export function DistributionChart({ buckets }: { buckets: DistributionBucket[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count))
  return (
    <div className="space-y-2">
      {buckets.map((b) => (
        <div key={b.label} className="flex items-center gap-3">
          <span className="w-11 shrink-0 text-xs font-semibold text-ink-soft">{b.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-raised">
            <div
              className="h-full rounded-full bg-mint transition-[width] duration-[220ms] ease-out"
              style={{ width: `${(b.count / max) * 100}%` }}
            />
          </div>
          <span className="w-5 shrink-0 text-right text-xs text-ink-faint">{b.count}</span>
        </div>
      ))}
    </div>
  )
}
