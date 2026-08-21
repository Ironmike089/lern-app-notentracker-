import { useMemo, useState, type ReactNode } from 'react'
import { GradeDataVersionContext, type GradeDataVersionContextValue } from './gradeDataVersion'

/**
 * Lets stats-displaying views (Dashboard, Subject Detail) refetch after a
 * grade mutation that happened elsewhere — e.g. via the global Quick Add FAB —
 * without prop drilling a refetch callback through the whole tree.
 */
export function GradeDataVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const value = useMemo<GradeDataVersionContextValue>(
    () => ({ version, bumpVersion: () => setVersion((v) => v + 1) }),
    [version],
  )
  return <GradeDataVersionContext.Provider value={value}>{children}</GradeDataVersionContext.Provider>
}
