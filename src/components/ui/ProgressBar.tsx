import { cn } from '../../utils/cn'

interface ProgressBarProps {
  value: number
  max: number
  className?: string
  colorClassName?: string
}

export function ProgressBar({ value, max, className, colorClassName }: ProgressBarProps) {
  const percent = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-bg-raised', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        className={cn('h-full rounded-full bg-mint transition-[width] duration-[220ms] ease-out', colorClassName)}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
