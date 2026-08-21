import type { GradingScale, SchoolType, StateCode } from '../../domain/types'

export interface SubjectSelectionDraft {
  key: string
  catalogId?: string
  name: string
  icon: string
  custom: boolean
}

export interface OnboardingDraft {
  state?: StateCode
  schoolType?: SchoolType
  gradeLevel?: number
  gradingScale?: GradingScale
  upperSecondary?: boolean
  subjectSelections: SubjectSelectionDraft[]
}
