import type { StateCode } from '../../types'
import type { StateRuleConfig } from '../types'
import { BAVARIA_GYMNASIUM_2027_V1 } from './by'

/**
 * Registry of every state's *current* rule config — one entry per state
 * that has at least one verified config, keyed by state. Replaces the old
 * domain/abiturRules.ts placeholder (empty array + gate) now that Bavaria
 * has a real, sourced config; every other state stays absent here on
 * purpose rather than holding a guessed config — see docs/abi-rules-audit.md.
 */
const STATE_RULE_CONFIGS: Partial<Record<StateCode, StateRuleConfig>> = {
  BY: BAVARIA_GYMNASIUM_2027_V1,
}

export function getStateRuleConfig(state: StateCode): StateRuleConfig | null {
  return STATE_RULE_CONFIGS[state] ?? null
}

export function hasVerifiedAbiRules(state: StateCode): boolean {
  return getStateRuleConfig(state)?.verified === true
}
