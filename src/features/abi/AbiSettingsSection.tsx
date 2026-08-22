import { useEffect, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import type { AbiProfile, SchoolProfile } from '../../domain/types'
import { getStateRuleConfig, hasVerifiedAbiRules } from '../../domain/abi/states'
import type { StateRuleConfig } from '../../domain/abi/types'
import { getAbiProfile } from '../../services/abiProfileService'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { AbiSetupWizard } from './AbiSetupWizard'

/**
 * Only rendered by MorePage when profile.upperSecondary is true and the
 * state has a verified RuleConfig — every other profile never sees this
 * section at all (see domain/abi/types.ts and docs/abi-rules-audit.md).
 */
export function AbiSettingsSection({ profile, onChanged }: { profile: SchoolProfile; onChanged: () => void }) {
  const [config, setConfig] = useState<StateRuleConfig | null>(null)
  const [abiProfile, setAbiProfile] = useState<AbiProfile | undefined>()
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    setConfig(getStateRuleConfig(profile.state))
    getAbiProfile().then(setAbiProfile)
  }, [profile.state])

  if (!hasVerifiedAbiRules(profile.state) || !config) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-ink-soft">Abitur</p>
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">
            <GraduationCap className="h-4.5 w-4.5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">
              {config.state} · Abitur {abiProfile?.graduationYear ?? config.graduationYearFrom}
            </p>
            <p className="text-xs text-ink-faint">Regelwerk {config.ruleVersion} · zuletzt geprüft {config.lastVerifiedAt}</p>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-medium text-ink-faint">Offizielle Quellen</p>
          <ul className="space-y-0.5">
            {config.sourceReferences.slice(0, 3).map((ref) => (
              <li key={ref.url} className="truncate text-xs text-ink-soft">
                {ref.label}
              </li>
            ))}
          </ul>
        </div>

        <Button variant="secondary" size="md" className="w-full" onClick={() => setWizardOpen(true)}>
          {abiProfile ? 'Abitur-Daten bearbeiten' : 'Abitur einrichten'}
        </Button>
      </Card>

      <AbiSetupWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        config={config}
        onCompleted={() => {
          getAbiProfile().then(setAbiProfile)
          onChanged()
        }}
      />
    </div>
  )
}
