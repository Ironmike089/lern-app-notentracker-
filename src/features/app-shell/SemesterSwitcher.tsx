import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../utils/cn'
import { useSemesterView } from './semesterView'

export function SemesterSwitcher() {
  const { semesters, selectedSemester, selectSemester } = useSemesterView()
  const [open, setOpen] = useState(false)

  if (semesters.length === 0 || !selectedSemester) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full bg-bg-card px-2.5 py-1 text-xs font-medium text-ink-soft transition-colors hover:text-ink"
      >
        {selectedSemester.label}
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
            className="animate-toast-in absolute right-0 top-full z-30 mt-2 min-w-32 overflow-hidden rounded-control border border-border-strong bg-bg-card shadow-lg"
          >
            {semesters.map((semester) => (
              <button
                key={semester.id}
                type="button"
                role="option"
                aria-selected={semester.id === selectedSemester.id}
                onClick={() => {
                  selectSemester(semester.id)
                  setOpen(false)
                }}
                className={cn(
                  'block w-full px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-bg-card-hover',
                  semester.id === selectedSemester.id ? 'text-mint font-semibold' : 'text-ink-soft',
                )}
              >
                {semester.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
