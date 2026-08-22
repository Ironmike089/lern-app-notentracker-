import type { AbiProfile, SchoolProfile, Semester, Subject } from '../domain/types'
import { calculateAbiResult, calculateBlockI, calculateBlockII, type ExamResultInput, type HalfYearResultInput } from '../domain/abi/calculator'
import { getStateRuleConfig } from '../domain/abi/states'
import { calculateBavariaSeminarScore } from '../domain/abi/states/byCalculator'
import type { AbiCalculationResult, StateRuleConfig } from '../domain/abi/types'
import { getSchoolProfile } from './onboardingService'
import { getAbiProfile } from './abiProfileService'
import { getSeminarAssessment } from './seminarAssessmentService'
import { getAllSemesters } from './schoolYearService'
import { getSubjectStats } from './gradeStatsService'
import { subjectRepository } from '../storage/repositories'

/**
 * DB-orchestration layer for the Abi engine — loads real data (subjects,
 * semesters, the AbiProfile setup) and shapes it into the calculator.ts
 * inputs. The math itself stays in domain/abi/, untouched by any of this
 * fetching. Returns null whenever the prerequisites for a real calculation
 * aren't there yet (no verified state config, no AbiProfile) — the caller
 * shows "noch nicht berechenbar", never a fabricated number.
 */

export interface AbiContext {
  schoolProfile: SchoolProfile
  abiProfile: AbiProfile
  config: StateRuleConfig
  semesters: Semester[]
  subjects: Subject[]
}

export async function loadAbiContext(): Promise<AbiContext | null> {
  const schoolProfile = await getSchoolProfile()
  if (!schoolProfile || !schoolProfile.upperSecondary) return null

  const config = getStateRuleConfig(schoolProfile.state)
  if (!config) return null

  const abiProfile = await getAbiProfile()
  if (!abiProfile) return null

  const [allSemesters, allSubjects] = await Promise.all([getAllSemesters(), subjectRepository.getAll()])
  const semesters = allSemesters.slice(0, config.qualificationPhase.semesterNames.length)
  const subjects = allSubjects.filter((s) => !s.archived)

  return { schoolProfile, abiProfile, config, semesters, subjects }
}

export interface HalfYearGridCell {
  subjectId: string
  subjectName: string
  semesterName: string
  points: number | null
}

/** The full subject × Ausbildungsabschnitt grid, known cells and gaps alike — the shared basis for both the current status and any projection. */
export async function collectFullHalfYearGrid(context: AbiContext): Promise<HalfYearGridCell[]> {
  const { config, semesters, subjects } = context
  const regularSubjects = subjects.filter((s) => s.kind !== 'seminar')
  const grid: HalfYearGridCell[] = []

  for (let semesterIndex = 0; semesterIndex < semesters.length; semesterIndex++) {
    const semester = semesters[semesterIndex]
    const semesterName = config.qualificationPhase.semesterNames[semesterIndex] ?? semester.label

    for (const subject of regularSubjects) {
      const stats = await getSubjectStats(subject, semester.id)
      const points = stats.average.value !== null && stats.average.scale === config.gradingScale ? stats.average.value : null
      grid.push({ subjectId: subject.id, subjectName: subject.name, semesterName, points })
    }
  }

  return grid
}

async function collectHalfYearResults(context: AbiContext): Promise<{ results: HalfYearResultInput[]; warnings: string[] }> {
  const { config, semesters } = context
  const grid = await collectFullHalfYearGrid(context)
  const results: HalfYearResultInput[] = grid
    .filter((cell) => cell.points !== null)
    .map((cell) => ({ semesterName: cell.semesterName, points: cell.points }))

  const warnings: string[] = []
  if (semesters.length !== config.qualificationPhase.semesterNames.length) {
    warnings.push(
      `Es sind ${semesters.length} von ${config.qualificationPhase.semesterNames.length} Ausbildungsabschnitten angelegt — die Berechnung bezieht sich nur auf die vorhandenen.`,
    )
  }
  if (results.length !== config.qualificationPhase.requiredContributions) {
    warnings.push(
      `Diese Berechnung nutzt alle ${results.length} erfassten Halbjahresleistungen, nicht die offiziell optimierte ` +
        `Pflichteinbringung von ${config.qualificationPhase.requiredContributions} — die Einbringungsregeln für ` +
        'dieses Bundesland sind noch nicht vollständig verifiziert (siehe docs/abi-rules-audit.md).',
    )
  }

  return { results, warnings }
}

export interface ExamGridCell {
  subjectId: string
  subjectLabel: string
  points: number | null
}

export function collectExamGrid(context: AbiContext): ExamGridCell[] {
  const { abiProfile, subjects } = context
  const examSubjectIds = [...new Set([...abiProfile.writtenExamSubjectIds, ...abiProfile.oralExamSubjectIds])]
  return examSubjectIds.map((subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId)
    return { subjectId, subjectLabel: subject?.name ?? 'Unbekanntes Fach', points: abiProfile.examPoints[subjectId] ?? null }
  })
}

function collectExamResults(context: AbiContext): ExamResultInput[] {
  return collectExamGrid(context).map(({ subjectLabel, points }) => ({ subjectLabel, points }))
}

/** The current, honest status — only real, already-recorded results, nothing projected. */
export async function calculateCurrentAbiStatus(): Promise<AbiCalculationResult | null> {
  const context = await loadAbiContext()
  if (!context) return null

  const { results: halfYearResults, warnings } = await collectHalfYearResults(context)
  const examResults = collectExamResults(context)

  const blockI = calculateBlockI(context.config, halfYearResults)
  const blockII = calculateBlockII(context.config, examResults)

  return calculateAbiResult({
    config: context.config,
    blockI,
    blockII,
    knownResultsCount: blockI.completedCount + blockII.completedCount,
    predictedResultsCount: 0,
    warnings,
    assumptions: [],
  })
}

export interface SeminarStatus {
  subjectId: string
  subjectName: string
  seminarPaperPoints: number | null
  presentationPoints: number | null
  totalScore: number | null
  maxPoints: number
}

export interface ExamSubjectOverviewRow {
  subjectId: string
  subjectName: string
  subjectIcon: string
  role: 'schriftlich' | 'mündlich'
  isPerformanceSubject: boolean
  points: number | null
}

/** The actually-known (or still-missing) Abiturprüfung results per exam subject — what the UI needs to let a student enter Block II. */
export async function getExamSubjectsOverview(): Promise<ExamSubjectOverviewRow[]> {
  const context = await loadAbiContext()
  if (!context) return []
  const { abiProfile, subjects } = context

  function toRow(subjectId: string, role: ExamSubjectOverviewRow['role']): ExamSubjectOverviewRow {
    const subject = subjects.find((s) => s.id === subjectId)
    return {
      subjectId,
      subjectName: subject?.name ?? 'Unbekanntes Fach',
      subjectIcon: subject?.icon ?? 'book-open',
      role,
      isPerformanceSubject: abiProfile.performanceSubjectIds.includes(subjectId),
      points: abiProfile.examPoints[subjectId] ?? null,
    }
  }

  return [
    ...abiProfile.writtenExamSubjectIds.map((id) => toRow(id, 'schriftlich')),
    ...abiProfile.oralExamSubjectIds.map((id) => toRow(id, 'mündlich')),
  ]
}

export interface HalfYearOverviewRow {
  subjectId: string
  subjectName: string
  subjectIcon: string
  cells: { semesterName: string; points: number | null }[]
}

/** Every Block-I-contributing subject with its per-Ausbildungsabschnitt Halbjahresnote, for a subject-by-subject review (no averaging, just the raw grid grouped by subject). */
export async function getHalfYearOverview(): Promise<HalfYearOverviewRow[]> {
  const context = await loadAbiContext()
  if (!context) return []

  const grid = await collectFullHalfYearGrid(context)
  const rows = new Map<string, HalfYearOverviewRow>()
  for (const cell of grid) {
    let row = rows.get(cell.subjectId)
    if (!row) {
      const subject = context.subjects.find((s) => s.id === cell.subjectId)
      row = { subjectId: cell.subjectId, subjectName: cell.subjectName, subjectIcon: subject?.icon ?? 'book-open', cells: [] }
      rows.set(cell.subjectId, row)
    }
    row.cells.push({ semesterName: cell.semesterName, points: cell.points })
  }
  return [...rows.values()]
}

/** Bavaria-only: the W-Seminar's own separately-tracked score (see docs/abi-rules-audit.md — not folded into Block I). */
export async function getSeminarStatus(): Promise<SeminarStatus | null> {
  const context = await loadAbiContext()
  if (!context || context.config.state !== 'BY') return null

  const seminarSubject = context.subjects.find((s) => s.kind === 'seminar')
  if (!seminarSubject) return null

  const assessment = await getSeminarAssessment(seminarSubject.id)
  const seminarPaperPoints = assessment?.seminarPaperPoints ?? null
  const presentationPoints = assessment?.presentationPoints ?? null

  return {
    subjectId: seminarSubject.id,
    subjectName: seminarSubject.name,
    seminarPaperPoints,
    presentationPoints,
    totalScore: calculateBavariaSeminarScore(seminarPaperPoints, presentationPoints),
    maxPoints: context.config.seminarModules[0]?.maxPoints ?? 30,
  }
}
