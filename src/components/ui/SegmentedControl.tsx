import { cn } from '../../utils/cn'

interface SegmentedControlProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  'aria-label': string
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-1 rounded-control bg-bg-raised p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded-[0.45rem] py-2 text-sm font-semibold transition-all duration-200',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
            option.value === value ? 'bg-bg-card text-ink shadow' : 'text-ink-soft hover:text-ink',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
