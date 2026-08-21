import { createContext, useContext } from 'react'
import type { Semester } from '../../domain/types'

export interface SemesterViewContextValue {
  semesters: Semester[]
  selectedSemesterId: string | null
  selectedSemester: Semester | null
  selectSemester: (id: string) => void
  loading: boolean
}

export const SemesterViewContext = createContext<SemesterViewContextValue | null>(null)

export function useSemesterView(): SemesterViewContextValue {
  const ctx = useContext(SemesterViewContext)
  if (!ctx) throw new Error('useSemesterView must be used within a SemesterViewProvider')
  return ctx
}
