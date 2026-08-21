import { gradeValueBounds } from '../../domain/grading'
import type { GradingScale } from '../../domain/types'
import { cn } from '../../utils/cn'

interface ValuePickerProps {
  scale: GradingScale
  value: number | null
  onChange: (value: number) => void
}

/**
 * A bounded button grid instead of free-text input — for a scale this small
 * (6 or 16 options) it's both faster to tap than typing and structurally
 * prevents invalid values, rather than validating them after the fact.
 */
export function ValuePicker({ scale, value, onChange }: ValuePickerProps) {
  const { min, max } = gradeValueBounds(scale)
  const options = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const isPoints = scale === 'points_0_15'

  return (
    <div className={cn('grid gap-2', isPoints ? 'grid-cols-4' : 'grid-cols-6')} role="radiogroup">
      {options.map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option)}
            className={cn(
              'flex h-12 items-center justify-center rounded-control border text-base font-semibold transition-all duration-200 active:scale-[0.96]',
              'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
              selected
                ? 'border-mint bg-mint text-[#06140f]'
                : 'border-border bg-bg-raised text-ink hover:border-border-strong',
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
