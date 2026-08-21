import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
}

export function Card({ children, className, interactive, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-bg-card p-4 transition-colors duration-200',
        interactive && 'cursor-pointer hover:bg-bg-card-hover hover:border-border-strong',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
