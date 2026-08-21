import { cn } from '../utils/cn'

interface LogoProps {
  size?: number
  className?: string
}

/**
 * Abstract brand mark — an ascending line with a highlighted endpoint.
 * Deliberately not a graduation cap or a round grade bubble; a placeholder
 * that reads as "progress" without borrowing any specific reference app's shape.
 */
export function Logo({ size = 20, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      className={cn('shrink-0', className)}
      role="img"
      aria-label="App-Logo"
    >
      <rect width="64" height="64" rx="16" className="fill-bg-raised" />
      <path
        d="M16 40L26 30L34 38L48 22"
        stroke="var(--color-mint)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="48" cy="22" r="4.5" fill="var(--color-mint)" />
    </svg>
  )
}
