import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import { cn } from '../../utils/cn'

interface SelectableCardProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean
  icon?: ReactNode
  title: string
  subtitle?: string
}

export function SelectableCard({
  selected,
  icon,
  title,
  subtitle,
  className,
  ...props
}: SelectableCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        'group flex w-full items-center gap-3 rounded-card border p-4 text-left transition-all duration-200',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
        selected
          ? 'border-mint bg-mint-soft/40'
          : 'border-border bg-bg-card hover:border-border-strong hover:bg-bg-card-hover active:scale-[0.99]',
        className,
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            selected ? 'bg-mint text-[#06140f]' : 'bg-bg-raised text-ink-soft',
          )}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{title}</span>
        {subtitle && <span className="block truncate text-xs text-ink-soft">{subtitle}</span>}
      </span>
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
          selected ? 'border-mint bg-mint text-[#06140f]' : 'border-border-strong text-transparent',
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </span>
    </button>
  )
}
