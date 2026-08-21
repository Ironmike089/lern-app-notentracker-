import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children: ReactNode
}

const VARIANT_STYLES: Record<Variant, string> = {
  primary:
    'bg-mint text-[#06140f] hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:hover:brightness-100',
  secondary:
    'bg-bg-card border border-border-strong text-ink hover:bg-bg-card-hover active:brightness-95 disabled:opacity-40',
  ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-bg-card disabled:opacity-40',
  danger:
    'bg-danger text-white hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:hover:brightness-100',
}

const SIZE_STYLES: Record<Size, string> = {
  md: 'h-11 px-4 text-sm rounded-control',
  lg: 'h-[3.25rem] px-6 text-base rounded-control',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 ease-out cursor-pointer',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
