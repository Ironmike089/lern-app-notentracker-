import { ArrowUpDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'
import { SORT_OPTIONS, type SubjectSortOption } from './subjectSort'

interface SubjectSortControlProps {
  value: SubjectSortOption
  onChange: (value: SubjectSortOption) => void
}

export function SubjectSortControl({ value, onChange }: SubjectSortControlProps) {
  const [open, setOpen] = useState(false)
  const currentLabel = SORT_OPTIONS.find((o) => o.value === value)?.label ?? 'Sortieren'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-control px-2 py-1 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        <ArrowUpDown className="h-3.5 w-3.5" strokeWidth={2} />
        {currentLabel}
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
            className="animate-toast-in absolute right-0 top-full z-30 mt-2 min-w-40 overflow-hidden rounded-control border border-border-strong bg-bg-card shadow-lg"
          >
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={cn(
                  'block w-full px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-bg-card-hover',
                  option.value === value ? 'font-semibold text-mint' : 'text-ink-soft',
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
