import type { InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../utils/cn'

export function SearchInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        strokeWidth={2}
        aria-hidden="true"
      />
      <input
        type="text"
        className={cn(
          'h-11 w-full rounded-control border border-border bg-bg-raised pl-10 pr-4 text-sm text-ink',
          'placeholder:text-ink-faint outline-none transition-colors duration-200',
          'focus:border-mint',
          className,
        )}
        {...props}
      />
    </div>
  )
}
