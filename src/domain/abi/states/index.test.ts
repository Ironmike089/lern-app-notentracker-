import { describe, expect, it } from 'vitest'
import { GERMAN_STATES } from '../../germanStates'
import { getStateRuleConfig, hasVerifiedAbiRules } from './index'

/**
 * The audit gate from docs/abi-rules-audit.md, enforced in code: a config
 * may only claim verified: true if it actually carries a source, a version,
 * a graduation-year anchor and a last-verified date — "lieber keine
 * Berechnung als eine falsche".
 */
describe('state rule config registry', () => {
  it('marks every verified config with a non-empty source, version and verification date', () => {
    for (const { code } of GERMAN_STATES) {
      const config = getStateRuleConfig(code)
      if (!config?.verified) continue
      expect(config.sourceReferences.length, `${code}: sourceReferences`).toBeGreaterThan(0)
      expect(config.ruleVersion.length, `${code}: ruleVersion`).toBeGreaterThan(0)
      expect(config.graduationYearFrom, `${code}: graduationYearFrom`).toBeGreaterThan(2000)
      expect(config.lastVerifiedAt.length, `${code}: lastVerifiedAt`).toBeGreaterThan(0)
    }
  })

  it('has at least one verified state (Bavaria) after this step', () => {
    expect(hasVerifiedAbiRules('BY')).toBe(true)
  })

  it('leaves every other state unverified rather than guessing their rules', () => {
    const otherStates = GERMAN_STATES.filter((s) => s.code !== 'BY')
    for (const { code } of otherStates) {
      expect(hasVerifiedAbiRules(code), `${code} should not be verified yet`).toBe(false)
      expect(getStateRuleConfig(code), `${code} should have no config yet`).toBeNull()
    }
  })
})
