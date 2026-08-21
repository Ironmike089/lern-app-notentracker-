import { createContext, useContext } from 'react'
import type { QuickAddPrefill } from './QuickAddSheet'

export interface QuickAddContextValue {
  openQuickAdd: (prefill?: QuickAddPrefill) => void
}

export const QuickAddContext = createContext<QuickAddContextValue | null>(null)

export function useQuickAdd(): QuickAddContextValue {
  const ctx = useContext(QuickAddContext)
  if (!ctx) throw new Error('useQuickAdd must be used within a QuickAddProvider')
  return ctx
}
