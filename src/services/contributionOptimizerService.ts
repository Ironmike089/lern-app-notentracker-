import { loadAbiContext } from './abiCalculatorService'

export interface ContributionOptimizationResult {
  available: boolean
  reason: string
}

/**
 * "Beste zulässige Einbringung" — a real implementation needs verified
 * Einbringungs-/Streich-/Defizitregeln per Aufgabenfeld, which no state
 * (including Bavaria) has yet in docs/abi-rules-audit.md. Rather than
 * approximate it with a plausible-looking heuristic, this stays an honest
 * "not available" so the architecture is ready the moment those rules are
 * verified, without ever having shipped a wrong optimization in the
 * meantime.
 */
export async function optimizeContribution(): Promise<ContributionOptimizationResult> {
  const context = await loadAbiContext()
  if (!context) {
    return { available: false, reason: 'Kein aktives Abitur-Profil.' }
  }
  return {
    available: false,
    reason:
      'Einbringungs- und Streichregeln für dieses Bundesland sind noch nicht verifiziert (siehe docs/abi-rules-audit.md). ' +
      'Alle erfassten Halbjahresleistungen fließen daher unverändert in Block I ein.',
  }
}
