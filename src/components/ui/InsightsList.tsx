import { Lightbulb } from 'lucide-react'
import type { Insight } from '../../domain/insights'

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null
  return (
    <div className="space-y-2">
      {insights.map((insight) => (
        <div key={insight.id} className="flex items-start gap-2.5 rounded-card border border-border bg-bg-card p-3.5">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-violet" strokeWidth={2} />
          <p className="text-sm text-ink-soft">{insight.text}</p>
        </div>
      ))}
    </div>
  )
}
