import type { StateCode } from './types'

/**
 * Architecture placeholder for a future, per-Bundesland Abitur calculator.
 *
 * Abitur rules differ by state and change over time — this app never guesses
 * them from memory. A concrete AbiRuleConfig may only be added here once its
 * rules have been checked against an official source, with that source
 * recorded on the config itself. Until a state has a verified config, the
 * app stays a neutral "Oberstufen-Punktetracker" and must never claim to
 * show an official Abitur grade (see hasVerifiedAbiRules below, and gate any
 * such UI behind it).
 */

export interface CourseRule {
  description: string
}

export interface SemesterRule {
  description: string
}

export interface ExamRule {
  description: string
}

export interface TotalPointRule {
  description: string
}

export interface AbiRuleConfig {
  state: StateCode
  version: string
  validFrom: string
  courseRules: CourseRule[]
  semesterRules: SemesterRule[]
  examRules: ExamRule[]
  totalPointRules: TotalPointRule[]
  /** Citation for where these rules were verified — required, never left implicit. */
  source: string
}

/** Empty on purpose. Add an entry only once its rules have been sourced and verified for real. */
const VERIFIED_ABI_RULE_CONFIGS: AbiRuleConfig[] = []

export function getVerifiedAbiRuleConfig(state: StateCode): AbiRuleConfig | null {
  return VERIFIED_ABI_RULE_CONFIGS.find((c) => c.state === state) ?? null
}

export function hasVerifiedAbiRules(state: StateCode): boolean {
  return getVerifiedAbiRuleConfig(state) !== null
}
