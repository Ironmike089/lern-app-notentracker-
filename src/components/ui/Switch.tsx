import { cn } from '../../utils/cn'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-pill border transition-colors duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
        checked ? 'border-mint bg-mint' : 'border-border-strong bg-bg-raised',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-[1.125rem] w-[1.125rem] rounded-full bg-bg-card transition-transform duration-200',
          checked ? 'translate-x-[1.4rem]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}
