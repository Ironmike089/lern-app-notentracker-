import { Calendar, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'
import type { AnalysisDateFilter, ResolvedAnalysisFilter } from '../../services/analysisFilterService'

interface AnalysisFilterControlProps {
  options: ResolvedAnalysisFilter[]
  value: AnalysisDateFilter
  onChange: (filter: AnalysisDateFilter) => void
}

export function AnalysisFilterControl({ options, value, onChange }: AnalysisFilterControlProps) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.filter.kind === value.kind)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-control border border-border bg-bg-card px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <Calendar className="h-3.5 w-3.5" strokeWidth={2} />
        {current?.label ?? 'Zeitraum'}
        <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Schließen"
            className="fixed inset-0 z-20 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="listbox"
            className="animate-toast-in absolute right-0 top-full z-30 mt-2 min-w-48 overflow-hidden rounded-control border border-border-strong bg-bg-card shadow-lg"
          >
            {options.map((option) => (
              <button
                key={option.filter.kind}
                type="button"
                role="option"
                disabled={!option.available}
                aria-selected={option.filter.kind === value.kind}
                onClick={() => {
                  onChange(option.filter)
                  setOpen(false)
                }}
                className={cn(
                  'block w-full px-3.5 py-2.5 text-left text-sm transition-colors',
                  !option.available ? 'cursor-not-allowed text-ink-faint/50' : 'hover:bg-bg-card-hover',
                  option.filter.kind === value.kind ? 'font-semibold text-mint' : 'text-ink-soft',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
