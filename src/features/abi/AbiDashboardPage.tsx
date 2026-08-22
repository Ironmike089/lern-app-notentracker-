import { useEffect, useState } from 'react'
import { CheckCircle2, CircleAlert, GraduationCap, HelpCircle, Info, Settings2, Sparkles, XCircle } from 'lucide-react'
import { getSchoolProfile } from '../../services/onboardingService'
import { getStateRuleConfig } from '../../domain/abi/states'
import type { AbiCalculationResult, EligibilityCheck, StateRuleConfig } from '../../domain/abi/types'
import { calculateCurrentAbiStatus, getSeminarStatus, type SeminarStatus } from '../../services/abiCalculatorService'
import { calculateAbiProjection } from '../../services/abiProjectionService'
import { getEligibilityChecks } from '../../services/abiEligibilityService'
import { getAbiProfile } from '../../services/abiProfileService'
import { performanceScore, performanceTierFromScore } from '../../domain/grading'
import { PerformanceGauge } from '../../components/ui/PerformanceGauge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { AbiSetupWizard } from './AbiSetupWizard'
import { AbiSimulatorSheet } from './AbiSimulatorSheet'
import { AbiExamSubjectsCard } from './AbiExamSubjectsCard'
import { AbiHalfYearOverview } from './AbiHalfYearOverview'

const ELIGIBILITY_ICON: Record<EligibilityCheck['status'], React.ReactNode> = {
  met: <CheckCircle2 className="h-4 w-4 shrink-0 text-perf-excellent" strokeWidth={2} />,
  unmet: <XCircle className="h-4 w-4 shrink-0 text-perf-critical" strokeWidth={2} />,
  unknown: <CircleAlert className="h-4 w-4 shrink-0 text-perf-medium" strokeWidth={2} />,
}

function BlockProgress({ label, block }: { label: string; block: AbiCalculationResult['blockI'] }) {
  const percent = block.maxPoints > 0 ? Math.min(100, (block.completedPoints / block.maxPoints) * 100) : 0
  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-sm font-bold tabular-nums text-ink">
          {block.completedPoints} / {block.maxPoints} P.
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-raised">
        <div className="h-full rounded-full bg-mint transition-[width] duration-300 ease-out" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-ink-faint">
        {block.completedCount} von {block.requiredCount} bekannt
        {block.isProvisional && ' · vorläufig'}
      </p>
    </Card>
  )
}

export function AbiDashboardPage() {
  const { version, bumpVersion } = useGradeDataVersion()
  const [config, setConfig] = useState<StateRuleConfig | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  const [status, setStatus] = useState<AbiCalculationResult | null>(null)
  const [projection, setProjection] = useState<AbiCalculationResult | null>(null)
  const [seminar, setSeminar] = useState<SeminarStatus | null>(null)
  const [checks, setChecks] = useState<EligibilityCheck[]>([])
  const [loading, setLoading] = useState(true)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    getSchoolProfile().then(async (profile) => {
      if (!active || !profile) return
      const stateConfig = getStateRuleConfig(profile.state)
      setConfig(stateConfig)
      if (!stateConfig) {
        setLoading(false)
        return
      }
      const abiProfile = await getAbiProfile()
      if (!active) return
      setHasProfile(!!abiProfile)
      if (!abiProfile) {
        setLoading(false)
        return
      }
      const [currentStatus, currentProjection, seminarStatus, eligibility] = await Promise.all([
        calculateCurrentAbiStatus(),
        calculateAbiProjection('currentAverage'),
        getSeminarStatus(),
        getEligibilityChecks(),
      ])
      if (!active) return
      setStatus(currentStatus)
      setProjection(currentProjection)
      setSeminar(seminarStatus)
      setChecks(eligibility)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [version])

  if (loading) return <DashboardSkeleton />

  if (!config) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 md:max-w-2xl">
        <h1 className="text-xl font-bold text-ink">Abitur</h1>
        <EmptyState
          icon={<GraduationCap className="h-5 w-5" strokeWidth={1.75} />}
          title="Für dein Bundesland noch nicht verfügbar"
          description="Die Abiturregeln deines Bundeslandes wurden noch nicht offiziell verifiziert — siehe docs/abi-rules-audit.md."
        />
      </div>
    )
  }

  if (!hasProfile) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 md:max-w-2xl">
        <h1 className="text-xl font-bold text-ink">Abitur</h1>
        <EmptyState
          icon={<Sparkles className="h-5 w-5" strokeWidth={1.75} />}
          title="Abitur-Modul einrichten"
          description={`Für ${config.state} (Abitur ab ${config.graduationYearFrom}) sind Regeln hinterlegt. Richte dein Leistungsfach und deine Prüfungsfächer ein, um deinen Punkteschnitt und eine Prognose zu sehen.`}
          action={
            <Button size="md" onClick={() => setWizardOpen(true)}>
              Einrichten
            </Button>
          }
        />
        <AbiSetupWizard
          open={wizardOpen}
          onClose={() => setWizardOpen(false)}
          config={config}
          onCompleted={() => {
            bumpVersion()
          }}
        />
      </div>
    )
  }

  const averagePoints = status && status.blockI.completedCount > 0 ? status.blockI.completedPoints / status.blockI.completedCount : null
  const score = averagePoints !== null ? performanceScore(averagePoints, 'points_0_15') : null
  const tier = score !== null ? performanceTierFromScore(score) : null

  return (
    <div className="mx-auto w-full max-w-md space-y-6 md:max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-ink">Abitur</h1>
        <Button variant="secondary" size="md" onClick={() => setWizardOpen(true)} aria-label="Abitur-Daten bearbeiten">
          <Settings2 className="h-4 w-4" strokeWidth={2} />
        </Button>
      </div>

      <Card className="space-y-1">
        {score !== null && tier !== null ? (
          <PerformanceGauge
            score={score}
            tier={tier}
            primaryValue={averagePoints !== null ? `${averagePoints.toFixed(1)} P.` : '–'}
            primaryLabel="Aktueller Punkteschnitt"
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink-faint">Noch keine Halbjahresleistungen erfasst.</p>
        )}

        {projection && projection.predictedResultsCount > 0 && (
          <p className="text-center text-xs text-ink-faint">
            Prognose berücksichtigt {projection.predictedResultsCount} angenommene von{' '}
            {projection.knownResultsCount + projection.predictedResultsCount} Ergebnissen.
          </p>
        )}

        {!config.gradeConversion.available && (
          <p className="flex items-start gap-1.5 text-xs text-ink-faint">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            {config.gradeConversion.note}
          </p>
        )}
      </Card>

      <Button variant="secondary" size="md" className="w-full" onClick={() => setSimulatorOpen(true)}>
        Abitur simulieren
      </Button>

      {status && (
        <div className="space-y-2">
          <BlockProgress label="Block I — Qualifikationsphase" block={status.blockI} />
          <BlockProgress label="Block II — Abiturprüfungen" block={status.blockII} />
        </div>
      )}

      <AbiHalfYearOverview />

      <AbiExamSubjectsCard />

      {seminar && (
        <Card className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">W-Seminar</p>
            <p className="text-sm font-bold tabular-nums text-ink">
              {seminar.totalScore ?? '–'} / {seminar.maxPoints} P.
            </p>
          </div>
          <p className="text-xs text-ink-faint">
            Seminararbeit: {seminar.seminarPaperPoints ?? '–'} P. · Präsentation: {seminar.presentationPoints ?? '–'} P.
          </p>
        </Card>
      )}

      {checks.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Voraussetzungen</p>
          <Card className="space-y-2.5">
            {checks.map((check) => (
              <div key={check.id} className="flex items-start gap-2">
                {ELIGIBILITY_ICON[check.status]}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{check.label}</p>
                  <p className="text-xs text-ink-faint">{check.detail}</p>
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {status && status.warnings.length > 0 && (
        <div className="space-y-1.5">
          {status.warnings.map((warning) => (
            <p key={warning} className="flex items-start gap-1.5 text-xs text-ink-faint">
              <HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} />
              {warning}
            </p>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-ink-faint">
        Die Berechnung dient der persönlichen Planung. Maßgeblich sind die offiziellen Vorgaben deiner Schule und
        deines Bundeslandes.
      </p>

      <AbiSetupWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        config={config}
        onCompleted={() => bumpVersion()}
      />
      <AbiSimulatorSheet open={simulatorOpen} onClose={() => setSimulatorOpen(false)} config={config} current={status} />
    </div>
  )
}
