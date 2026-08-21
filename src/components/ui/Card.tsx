import type { HTMLAttributes, KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
}

export function Card({ children, className, interactive, onClick, onKeyDown, ...props }: CardProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(e)
    if (!interactive || !onClick || e.defaultPrevented) return
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(e as unknown as MouseEvent<HTMLDivElement>)
    }
  }

  return (
    <div
      className={cn(
        'rounded-card border border-border bg-bg-card p-4 transition-colors duration-200',
        interactive &&
          'cursor-pointer hover:bg-bg-card-hover hover:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
        className,
      )}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  )
}
