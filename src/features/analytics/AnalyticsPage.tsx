import { useEffect, useMemo, useState } from 'react'
import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import { formatGradeValue, performanceColorVar, performanceScore } from '../../domain/grading'
import { computeGradeDistribution } from '../../domain/analytics'
import type { Insight } from '../../domain/insights'
import { type OverallStats, type SubjectStats } from '../../services/gradeStatsService'
import {
  getAvailableAnalysisFilters,
  getGlobalInsights,
  getMostImprovedSubject,
  getOverallScoreDeltaLast30Days,
  getSchoolYearSemesterComparison,
  getStatsForFilter,
  type AnalysisDateFilter,
  type MostImprovedSubject,
  type ResolvedAnalysisFilter,
} from '../../services/analysisFilterService'
import type { PeriodScoreDelta, SemesterComparisonResult } from '../../domain/analytics'
import { EmptyState } from '../../components/ui/EmptyState'
import { Card } from '../../components/ui/Card'
import { DistributionChart } from '../../components/ui/DistributionChart'
import { InsightsList } from '../../components/ui/InsightsList'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton'
import { sortSubjects } from '../dashboard/subjectSort'
import { AttentionSection } from '../dashboard/AttentionSection'
import { getAttentionSubjects } from '../dashboard/attention'
import { AnalysisFilterControl } from './AnalysisFilterControl'

function DeltaTile({ label, delta }: { label: string; delta: PeriodScoreDelta | null }) {
  return (
    <Card className="flex-1 space-y-1">
      <p className="text-xs font-medium text-ink-faint">{label}</p>
      {delta ? (
        <p
          className={
            'flex items-center gap-1 text-lg font-bold ' + (delta.improved ? 'text-perf-excellent' : 'text-perf-warning')
          }
        >
          {delta.improved ? (
            <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
          ) : (
            <TrendingDown className="h-4 w-4" strokeWidth={2.5} />
          )}
          {delta.delta > 0 ? '+' : ''}
          {Math.round(delta.delta)} %
        </p>
      ) : (
        <p className="text-sm text-ink-faint">Noch nicht genügend Daten.</p>
      )}
    </Card>
  )
}

function MostImprovedTile({ result }: { result: MostImprovedSubject | null }) {
  return (
    <Card className="flex-1 space-y-1">
      <p className="text-xs font-medium text-ink-faint">Meiste Verbesserung</p>
      {result ? (
        <p className="truncate text-sm font-semibold text-ink">{result.subject.name}</p>
      ) : (
        <p className="text-sm text-ink-faint">Noch nicht genügend Daten.</p>
      )}
    </Card>
  )
}

export function AnalyticsPage() {
  const { version } = useGradeDataVersion()

  const [filterOptions, setFilterOptions] = useState<ResolvedAnalysisFilter[]>([])
  const [filter, setFilter] = useState<AnalysisDateFilter>({ kind: 'currentSemester' })
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const [stats, setStats] = useState<OverallStats | null>(null)
  const [scoreDelta, setScoreDelta] = useState<PeriodScoreDelta | null>(null)
  const [mostImproved, setMostImproved] = useState<MostImprovedSubject | null>(null)
  const [semesterComparison, setSemesterComparison] = useState<SemesterComparisonResult | null>(null)
  const [globalInsights, setGlobalInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAvailableAnalysisFilters().then((options) => {
      setFilterOptions(options)
      const current = options.find((o) => o.filter.kind === 'currentSemester' && o.available)
      if (current) setFilter(current.filter)
    })
  }, [version])

  const effectiveFilter: AnalysisDateFilter = useMemo(
    () => (filter.kind === 'custom' ? { kind: 'custom', from: customFrom, to: customTo } : filter),
    [filter, customFrom, customTo],
  )

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      getStatsForFilter(effectiveFilter),
      getOverallScoreDeltaLast30Days(),
      getMostImprovedSubject(),
      getSchoolYearSemesterComparison(),
      getGlobalInsights(),
    ]).then(([s, delta, improved, comparison, insights]) => {
      if (!active) return
      setStats(s)
      setScoreDelta(delta)
      setMostImproved(improved)
      setSemesterComparison(comparison)
      setGlobalInsights(insights)
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [effectiveFilter, version])

  if (loading || filterOptions.length === 0) return <DashboardSkeleton />

  const header = (
    <div className="flex items-center justify-between">
      <h1 className="text-xl font-bold text-ink">Analyse</h1>
      <AnalysisFilterControl options={filterOptions} value={filter} onChange={setFilter} />
    </div>
  )

  const customRangeInputs = filter.kind === 'custom' && (
    <div className="flex gap-2">
      <input
        type="date"
        value={customFrom}
        onChange={(e) => setCustomFrom(e.target.value)}
        className="h-11 flex-1 rounded-control border border-border bg-bg-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-mint"
        aria-label="Von"
      />
      <input
        type="date"
        value={customTo}
        onChange={(e) => setCustomTo(e.target.value)}
        className="h-11 flex-1 rounded-control border border-border bg-bg-raised px-3.5 text-sm text-ink outline-none transition-colors focus:border-mint"
        aria-label="Bis"
      />
    </div>
  )

  if (!stats || stats.subjects.every((s: SubjectStats) => s.performanceScore === null)) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 lg:max-w-2xl">
        {header}
        {customRangeInputs}
        <EmptyState
          icon={<BarChart3 className="h-5 w-5" strokeWidth={1.75} />}
          title="Noch nichts zu analysieren"
          description="Sobald du Noten einträgst, siehst du hier deine Rangfolge und Entwicklung."
        />
      </div>
    )
  }

  const ranked = sortSubjects(stats.subjects, 'best').filter((s) => s.performanceScore !== null)
  const strongest = ranked[0]
  const overallScore =
    stats.average.value !== null && stats.average.scale !== null
      ? performanceScore(stats.average.value, stats.average.scale)
      : null
  const attentionSubjects = getAttentionSubjects(stats.subjects, overallScore)

  const allValues = stats.subjects.flatMap((s) => s.categories.flatMap((c) => c.entries.map((e) => e.value)))
  const distributionScale = stats.average.scale
  const distribution =
    distributionScale && allValues.length > 0 ? computeGradeDistribution(allValues, distributionScale) : null

  return (
    <div className="mx-auto w-full max-w-md space-y-6 lg:max-w-2xl">
      {header}
      {customRangeInputs}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-soft">Entwicklung</p>
        <div className="grid grid-cols-2 gap-3">
          <Card className="space-y-1">
            <p className="text-xs font-medium text-ink-faint">Aktueller Schnitt</p>
            <p className="text-2xl font-bold text-ink tabular-nums">
              {stats.average.value !== null && stats.average.scale !== null
                ? formatGradeValue(stats.average.value, stats.average.scale)
                : '–'}
            </p>
          </Card>
          <DeltaTile label="Letzte 30 Tage" delta={scoreDelta} />
          <Card className="space-y-1">
            <p className="text-xs font-medium text-ink-faint">Stärkstes Fach</p>
            {strongest && strongest.average.value !== null && strongest.average.scale !== null ? (
              <>
                <p className="truncate text-sm font-semibold text-ink">{strongest.subject.name}</p>
                <p className="text-sm text-ink-soft">{formatGradeValue(strongest.average.value, strongest.average.scale)}</p>
              </>
            ) : (
              <p className="text-sm text-ink-faint">–</p>
            )}
          </Card>
          <MostImprovedTile result={mostImproved} />
        </div>
      </div>

      <AttentionSection subjects={attentionSubjects} />

      {distribution && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Verteilung</p>
          <Card>
            <DistributionChart buckets={distribution} />
          </Card>
        </div>
      )}

      {semesterComparison && semesterComparison.comparisons.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Halbjahresvergleich</p>
          <div className="space-y-2">
            {semesterComparison.comparisons.map((c) => (
              <Card key={`${c.fromLabel}-${c.toLabel}`} className="flex items-center justify-between">
                <p className="text-sm text-ink-soft">
                  {c.fromLabel} → {c.toLabel}
                </p>
                <p className={c.improved ? 'text-sm font-bold text-perf-excellent' : 'text-sm font-bold text-perf-warning'}>
                  {Math.abs(c.delta).toFixed(2).replace('.', ',')} {c.improved ? 'besser' : 'schwächer'}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {globalInsights.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Beobachtungen</p>
          <InsightsList insights={globalInsights} />
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-soft">Rangfolge</p>
        <div className="space-y-2">
          {ranked.map((s, index) => (
            <Card key={s.subject.id} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-xs font-bold text-ink-faint">{index + 1}</span>
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-raised"
                style={{ color: s.performanceTier ? performanceColorVar(s.performanceTier) : undefined }}
              >
                <SubjectIcon iconKey={s.subject.icon} className="h-4 w-4" />
              </span>
              <p className="flex-1 truncate text-sm font-medium text-ink">{s.subject.name}</p>
              {s.average.value !== null && s.average.scale !== null && (
                <p className="shrink-0 text-sm font-bold text-ink">
                  {formatGradeValue(s.average.value, s.average.scale)}
                </p>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
