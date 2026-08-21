import { useEffect, useRef, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Animates a displayed number towards `value` whenever it changes (not on
 * first mount — that would just be a number appearing from nowhere). Skips
 * the animation entirely under prefers-reduced-motion.
 */
export function useCountUp(value: number | null, duration = 220): number | null {
  const [display, setDisplay] = useState(value)
  const prevRef = useRef(value)
  const mountedRef = useRef(false)
  const prefersReducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = value

    if (!mountedRef.current) {
      mountedRef.current = true
      setDisplay(value)
      return
    }

    if (value === null || prev === null || prefersReducedMotion) {
      setDisplay(value)
      return
    }

    const from = prev
    const delta = value - from
    if (delta === 0) {
      setDisplay(value)
      return
    }

    const start = performance.now()
    let frame: number

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - progress) * (1 - progress)
      setDisplay(from + delta * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, duration, prefersReducedMotion])

  return display
}
