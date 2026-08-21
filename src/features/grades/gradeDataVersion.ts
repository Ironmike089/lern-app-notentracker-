import { createContext, useContext } from 'react'

export interface GradeDataVersionContextValue {
  /** Bumps whenever a grade entry is created, edited, deleted or restored. */
  version: number
  bumpVersion: () => void
}

export const GradeDataVersionContext = createContext<GradeDataVersionContextValue | null>(null)

export function useGradeDataVersion(): GradeDataVersionContextValue {
  const ctx = useContext(GradeDataVersionContext)
  if (!ctx) throw new Error('useGradeDataVersion must be used within a GradeDataVersionProvider')
  return ctx
}
