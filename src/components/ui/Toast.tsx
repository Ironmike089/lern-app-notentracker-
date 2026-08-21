import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { createId } from '../../utils/id'
import { cn } from '../../utils/cn'
import { ToastContext, type ToastAction, type ToastVariant } from './toastContext'

interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
  action?: ToastAction
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
const ACTION_TOAST_DURATION_MS = 6000

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
    (message: string, variant: ToastVariant = 'info', action?: ToastAction) => {
      const id = createId()
      setToasts((prev) => [...prev, { id, message, variant, action }])
      const timer = setTimeout(() => dismiss(id), action ? ACTION_TOAST_DURATION_MS : TOAST_DURATION_MS)
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
              <p className="flex-1 text-sm text-ink">{toast.message}</p>
              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick()
                    dismiss(toast.id)
                  }}
                  className="shrink-0 rounded-control px-2 py-1 text-sm font-semibold text-mint underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint"
                >
                  {toast.action.label}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
