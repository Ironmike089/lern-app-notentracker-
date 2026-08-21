import { TriangleAlert } from 'lucide-react'

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 rounded-control border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
      <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
      <span>{message}</span>
    </div>
  )
}
