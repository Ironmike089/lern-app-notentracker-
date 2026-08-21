import { TriangleAlert } from 'lucide-react'

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-control border border-perf-bad/30 bg-perf-bad/10 px-3 py-2.5 text-sm text-perf-bad">
      <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span>{message}</span>
    </div>
  )
}
