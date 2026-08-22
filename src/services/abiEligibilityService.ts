import type { EligibilityCheck } from '../domain/abi/types'
import { calculateCurrentAbiStatus, loadAbiContext } from './abiCalculatorService'

/**
 * Only checks explicitly verified minimum-point rules (see
 * docs/abi-rules-audit.md) plus basic setup completeness. Deficit rules and
 * subject-combination requirements are NOT verified for any state yet, so
 * they never appear here — an absent check is safer than a wrong one.
 */
export async function getEligibilityChecks(): Promise<EligibilityCheck[]> {
  const context = await loadAbiContext()
  if (!context) return []

  const status = await calculateCurrentAbiStatus()
  const checks: EligibilityCheck[] = []

  checks.push({
    id: 'performance-subject',
    label: 'Leistungsfach festgelegt',
    status: context.abiProfile.performanceSubjectIds.length > 0 ? 'met' : 'unmet',
    detail:
      context.abiProfile.performanceSubjectIds.length > 0
        ? 'Leistungsfach ist eingetragen.'
        : 'Noch kein Leistungsfach ausgewählt.',
  })

  const requiredExamCount = context.config.examBlock.examCount
  const configuredExamCount = new Set([
    ...context.abiProfile.writtenExamSubjectIds,
    ...context.abiProfile.oralExamSubjectIds,
  ]).size
  checks.push({
    id: 'exam-subjects',
    label: `${requiredExamCount} Prüfungsfächer festgelegt`,
    status: configuredExamCount === requiredExamCount ? 'met' : 'unmet',
    detail: `${configuredExamCount} von ${requiredExamCount} Prüfungsfächern eingetragen.`,
  })

  if (status) {
    checks.push({
      id: 'block-i-minimum',
      label: `Mindestpunktzahl Qualifikationsphase (${context.config.qualificationPhase.minPoints})`,
      status: status.blockI.isProvisional ? 'unknown' : status.blockI.completedPoints >= context.config.qualificationPhase.minPoints ? 'met' : 'unmet',
      detail: status.blockI.isProvisional
        ? 'Noch nicht alle Halbjahresleistungen bekannt — noch nicht abschließend prüfbar.'
        : `${status.blockI.completedPoints} von mindestens ${context.config.qualificationPhase.minPoints} Punkten.`,
    })

    checks.push({
      id: 'block-ii-minimum',
      label: `Mindestpunktzahl Abiturprüfung (${context.config.examBlock.minPoints})`,
      status: status.blockII.isProvisional ? 'unknown' : status.blockII.completedPoints >= context.config.examBlock.minPoints ? 'met' : 'unmet',
      detail: status.blockII.isProvisional
        ? 'Noch nicht alle Prüfungsergebnisse bekannt — noch nicht abschließend prüfbar.'
        : `${status.blockII.completedPoints} von mindestens ${context.config.examBlock.minPoints} Punkten.`,
    })
  }

  return checks
}
