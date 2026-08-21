import { Info } from 'lucide-react'

export function WarningBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-control border border-perf-warning/30 bg-perf-warning/10 px-3 py-2.5 text-sm text-perf-warning">
      <Info className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span>{message}</span>
    </div>
  )
}
