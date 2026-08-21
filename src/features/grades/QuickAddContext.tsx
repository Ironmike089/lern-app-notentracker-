import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { QuickAddSheet, type QuickAddPrefill } from './QuickAddSheet'
import { useGradeDataVersion } from './gradeDataVersion'
import { QuickAddContext, type QuickAddContextValue } from './quickAdd'

/**
 * Owns the single global QuickAddSheet instance so both the floating action
 * button and per-category "+" buttons on the Subject Detail page can open
 * the same sheet (pre-filled differently) without prop drilling.
 */
export function QuickAddProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; prefill?: QuickAddPrefill }>({ open: false })
  const { bumpVersion } = useGradeDataVersion()

  const openQuickAdd = useCallback((prefill?: QuickAddPrefill) => {
    setState({ open: true, prefill })
  }, [])

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), [])

  const value = useMemo<QuickAddContextValue>(() => ({ openQuickAdd }), [openQuickAdd])

  return (
    <QuickAddContext.Provider value={value}>
      {children}
      <QuickAddSheet open={state.open} prefill={state.prefill} onClose={close} onSaved={bumpVersion} />
    </QuickAddContext.Provider>
  )
}
