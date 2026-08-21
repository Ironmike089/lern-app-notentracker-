import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Semester } from '../../domain/types'
import { getAllSemesters } from '../../services/schoolYearService'
import { SemesterViewContext, type SemesterViewContextValue } from './semesterView'

/**
 * Which Halbjahr/Kurshalbjahr the user is currently *viewing*. Deliberately
 * separate from Semester.isCurrent (the real-world current one) — switching
 * views here never writes to storage, it's pure UI state.
 */
export function SemesterViewProvider({ children }: { children: ReactNode }) {
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getAllSemesters().then((all) => {
      if (!active) return
      setSemesters(all)
      const initial = all.find((s) => s.isCurrent) ?? all[0]
      setSelectedSemesterId(initial?.id ?? null)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [])

  const value = useMemo<SemesterViewContextValue>(
    () => ({
      semesters,
      selectedSemesterId,
      selectedSemester: semesters.find((s) => s.id === selectedSemesterId) ?? null,
      selectSemester: setSelectedSemesterId,
      loading,
    }),
    [semesters, selectedSemesterId, loading],
  )

  return <SemesterViewContext.Provider value={value}>{children}</SemesterViewContext.Provider>
}
