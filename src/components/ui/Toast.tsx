import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { createId } from '../../utils/id'
import { cn } from '../../utils/cn'
import { ToastContext, type ToastVariant } from './toastContext'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

const ICONS: Record<ToastVariant, typeof Info> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
}

const VARIANT_TEXT: Record<ToastVariant, string> = {
  success: 'text-mint',
  error: 'text-danger',
  info: 'text-violet',
}

const TOAST_DURATION_MS = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = createId()
      setToasts((prev) => [...prev, { id, message, variant }])
      const timer = setTimeout(() => dismiss(id), TOAST_DURATION_MS)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  const value = useMemo(() => ({ showToast }), [showToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.variant]
          return (
            <div
              key={toast.id}
              role="status"
              className={cn(
                'animate-toast-in pointer-events-auto flex w-full max-w-sm items-center gap-2.5',
                'rounded-control border border-border-strong bg-bg-card px-4 py-3 shadow-lg',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', VARIANT_TEXT[toast.variant])} strokeWidth={2} />
              <p className="text-sm text-ink">{toast.message}</p>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
