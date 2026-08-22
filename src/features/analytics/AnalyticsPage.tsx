import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, BarChart3, Flame, GraduationCap, TrendingDown, TrendingUp } from 'lucide-react'
import { formatDateDe, formatGradeValue, performanceColorVar, performanceScore, type AverageResult } from '../../domain/grading'
import { computeGradeDistribution, type TrendPoint } from '../../domain/analytics'
import { CATEGORY_TYPE_LABEL } from '../../domain/assessmentCategories'
import { hasVerifiedAbiRules } from '../../domain/abi/states'
import type { Insight } from '../../domain/insights'
import { type OverallStats, type SubjectStats } from '../../services/gradeStatsService'
import { getSchoolProfile } from '../../services/onboardingService'
import { calculateAbiImpactPerSubject, type AbiImpactRow } from '../../services/abiImpactService'
import {
  getAvailableAnalysisFilters,
  getGlobalInsights,
  getMostImprovedSubject,
  getOverallScoreDeltaLast30Days,
  getSchoolYearSemesterComparison,
  getStatsForFilter,
  resolveEntryFilter,
  type AnalysisDateFilter,
  type MostImprovedSubject,
  type ResolvedAnalysisFilter,
} from '../../services/analysisFilterService'
import {
  calculateActivity,
  calculateCategoryPerformance,
  calculateOverallConsistency,
  calculatePerformanceHistory,
  calculateRecentStreak,
  calculateWrittenVsOralStats,
  getRecentEntries,
  type ActivityBreakdown,
  type CategoryTypeAverage,
  type RecentEntryView,
  type StreakResult,
} from '../../services/analyticsService'
import type { PeriodScoreDelta, SemesterComparisonResult, WrittenVsOralResult, ConsistencyResult } from '../../domain/analytics'
import { EmptyState } from '../../components/ui/EmptyState'
import { Card } from '../../components/ui/Card'
import { DistributionChart } from '../../components/ui/DistributionChart'
import { InsightsList } from '../../components/ui/InsightsList'
import { TrendChart } from '../../components/ui/TrendChart'
import { GradeBadge } from '../../components/ui/GradeBadge'
import { SubjectIcon } from '../../components/icons/subjectIcon'
import { useGradeDataVersion } from '../grades/gradeDataVersion'
import { DashboardSkeleton } from '../dashboard/DashboardSkeleton'
import { sortSubjects } from '../dashboard/subjectSort'
import { AttentionSection } from '../dashboard/AttentionSection'
import { getAttentionSubjects } from '../dashboard/attention'
import { AnalysisFilterControl } from './AnalysisFilterControl'

function scoreOf(average: AverageResult): number | null {
  if (average.value === null || average.scale === null) return null
  return performanceScore(average.value, average.scale)
}

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
      <p className="text-xs font-medium text-ink-faint">Größte Verbesserung</p>
      {result ? (
        <p className="truncate text-sm font-semibold text-ink">{result.subject.name}</p>
      ) : (
        <p className="text-sm text-ink-faint">Noch nicht genügend Daten.</p>
      )}
    </Card>
  )
}

function ImprovementPotentialTile({ subject }: { subject: SubjectStats | null }) {
  return (
    <Card className="flex-1 space-y-1">
      <p className="text-xs font-medium text-ink-faint">Verbesserungspotenzial</p>
      {subject && subject.average.value !== null && subject.average.scale !== null ? (
        <>
          <p className="truncate text-sm font-semibold text-ink">{subject.subject.name}</p>
          <p className="text-sm text-ink-soft">{formatGradeValue(subject.average.value, subject.average.scale)}</p>
        </>
      ) : (
        <p className="text-sm text-ink-faint">Noch nicht genügend Daten.</p>
      )}
    </Card>
  )
}

/** Ranked bar comparison — score-based so grade_1_6 and points_0_15 subjects sit on the same scale. */
function RankedSubjectBars({ subjects }: { subjects: SubjectStats[] }) {
  const navigate = useNavigate()
  if (subjects.length === 0) return null

  return (
    <div className="space-y-2">
      {subjects.map((s, index) => {
        const score = s.performanceScore ?? 0
        return (
          <button
            key={s.subject.id}
            type="button"
            onClick={() => navigate(`/app/subjects/${s.subject.id}`)}
            className="flex w-full items-center gap-3 rounded-card border border-border bg-bg-card p-3 text-left transition-colors duration-200 hover:bg-bg-card-hover"
          >
            <span className="w-4 shrink-0 text-center text-xs font-bold text-ink-faint">{index + 1}</span>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-bg-raised"
              style={{ color: s.performanceTier ? performanceColorVar(s.performanceTier) : undefined }}
            >
              <SubjectIcon iconKey={s.subject.icon} className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-ink">{s.subject.name}</p>
                {s.average.value !== null && s.average.scale !== null && (
                  <p className="shrink-0 text-sm font-bold text-ink tabular-nums">
                    {formatGradeValue(s.average.value, s.average.scale)}
                  </p>
                )}
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-raised">
                <div
                  className="h-full rounded-full transition-[width] duration-[220ms] ease-out"
                  style={{ width: `${score}%`, backgroundColor: s.performanceTier ? performanceColorVar(s.performanceTier) : undefined }}
                />
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/** Average per category *name* ("Notenarten"), aggregated across subjects — only names that actually have data show up. */
function CategoryPerformanceBars({ categories }: { categories: CategoryTypeAverage[] }) {
  if (categories.length === 0) return null
  return (
    <div className="space-y-2">
      {categories.map((c) => {
        const score = scoreOf(c.average) ?? 0
        return (
          <Card key={c.name} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-ink">{c.name}</p>
              <p className="shrink-0 text-xs text-ink-faint">
                {c.entryCount} {c.entryCount === 1 ? 'Eintrag' : 'Einträge'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-raised">
                <div className="h-full rounded-full bg-mint transition-[width] duration-[220ms] ease-out" style={{ width: `${score}%` }} />
              </div>
              {c.average.value !== null && c.average.scale !== null && (
                <span className="shrink-0 text-sm font-bold text-ink tabular-nums">
                  {formatGradeValue(c.average.value, c.average.scale)}
                </span>
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

function WrittenVsOralCard({ result }: { result: WrittenVsOralResult | null }) {
  if (!result || result.written.value === null || result.written.scale === null || result.oral.value === null || result.oral.scale === null) {
    return null
  }
  const writtenScore = performanceScore(result.written.value, result.written.scale)
  const oralScore = performanceScore(result.oral.value, result.oral.scale)
  return (
    <Card className="grid grid-cols-2 gap-4">
      <div className="space-y-1">
        <p className="text-xs font-medium text-ink-faint">Schriftlich</p>
        <p className="text-xl font-bold text-ink tabular-nums">{formatGradeValue(result.written.value, result.written.scale)}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-raised">
          <div className="h-full rounded-full bg-mint" style={{ width: `${writtenScore}%` }} />
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-xs font-medium text-ink-faint">Mündlich</p>
        <p className="text-xl font-bold text-ink tabular-nums">{formatGradeValue(result.oral.value, result.oral.scale)}</p>
        <div className="h-1.5 overflow-hidden rounded-full bg-bg-raised">
          <div className="h-full rounded-full bg-violet" style={{ width: `${oralScore}%` }} />
        </div>
      </div>
    </Card>
  )
}

function RecentEntriesList({ entries }: { entries: RecentEntryView[] }) {
  if (entries.length === 0) return null
  return (
    <div className="space-y-2">
      {entries.map(({ entry, subjectName, categoryName }) => (
        <Card key={entry.id} className="flex items-center gap-3">
          <GradeBadge value={entry.value} scale={entry.scale} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{subjectName}</p>
            <p className="truncate text-xs text-ink-faint">
              {categoryName} · {formatDateDe(entry.date)}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}

function ConsistencyActivityRow({
  consistency,
  activity,
  streak,
}: {
  consistency: ConsistencyResult | null
  activity: ActivityBreakdown | null
  streak: StreakResult | null
}) {
  const busiestType = useMemo(() => {
    if (!activity || activity.total === 0) return null
    const entries = Object.entries(activity.byType) as [string, number][]
    const [type, count] = entries.reduce((best, curr) => (curr[1] > best[1] ? curr : best))
    return count > 0 ? CATEGORY_TYPE_LABEL[type as keyof typeof CATEGORY_TYPE_LABEL] : null
  }, [activity])

  if (!consistency && !busiestType && !streak) return null

  return (
    <div className="grid grid-cols-3 gap-3">
      <Card className="space-y-1">
        <p className="text-xs font-medium text-ink-faint">Konstanz</p>
        <p className="text-sm font-semibold text-ink">{consistency ? consistency.label : '–'}</p>
      </Card>
      <Card className="space-y-1">
        <p className="text-xs font-medium text-ink-faint">Am aktivsten</p>
        <p className="truncate text-sm font-semibold text-ink">{busiestType ?? '–'}</p>
      </Card>
      <Card className="space-y-1">
        <p className="flex items-center gap-1 text-xs font-medium text-ink-faint">
          <Flame className="h-3.5 w-3.5" strokeWidth={2} />
          Serie
        </p>
        <p className="text-sm font-semibold text-ink">
          {streak && streak.aboveRunningAverage > 0 ? `${streak.aboveRunningAverage} über Schnitt` : '–'}
        </p>
      </Card>
    </div>
  )
}

/**
 * "Auswirkung auf Abi-Prognose" — only ever shown once an AbiProfile exists
 * for a verified state (see services/abiImpactService.ts). Deliberately
 * shows the total-points prognosis, not a fabricated Abitur grade, since
 * the grade-conversion table isn't verified (see docs/abi-rules-audit.md).
 */
function AbiImpactSection({ rows }: { rows: AbiImpactRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
        <GraduationCap className="h-4 w-4" strokeWidth={2} />
        Auswirkung auf Abi-Prognose
      </p>
      <div className="space-y-2">
        {rows.map((row) => {
          const delta = row.projectedTotalPoints - row.baselineTotalPoints
          return (
            <Card key={row.subjectId} className="space-y-1.5">
              <p className="text-sm font-semibold text-ink">{row.subjectName}</p>
              <p className="text-xs text-ink-soft">
                aktuell {row.currentAverage.toFixed(1)} P. · angenommene nächste HJL ({row.nextSemesterName}):{' '}
                {row.assumedNextPoints} P.
              </p>
              <p className="text-sm text-ink">
                Gesamtpunktzahl-Prognose: <span className="font-bold tabular-nums">{row.baselineTotalPoints}</span>
                {' → '}
                <span className="font-bold tabular-nums text-perf-excellent">{row.projectedTotalPoints} P.</span>
                {delta !== 0 && <span className="text-xs text-ink-faint"> ({delta > 0 ? '+' : ''}{delta})</span>}
              </p>
            </Card>
          )
        })}
      </div>
      <p className="text-xs text-ink-faint">
        Nutzt dieselbe vereinfachte Berechnung wie der Abi-Bereich (alle erfassten Halbjahresleistungen statt der
        optimierten Pflichteinbringung) — siehe docs/abi-rules-audit.md.
      </p>
    </div>
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
  const [history, setHistory] = useState<TrendPoint[]>([])
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryTypeAverage[]>([])
  const [writtenVsOral, setWrittenVsOral] = useState<WrittenVsOralResult | null>(null)
  const [consistency, setConsistency] = useState<ConsistencyResult | null>(null)
  const [activity, setActivity] = useState<ActivityBreakdown | null>(null)
  const [streak, setStreak] = useState<StreakResult | null>(null)
  const [recentEntries, setRecentEntries] = useState<RecentEntryView[]>([])
  const [abiImpact, setAbiImpact] = useState<AbiImpactRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAvailableAnalysisFilters().then((options) => {
      setFilterOptions(options)
      const current = options.find((o) => o.filter.kind === 'currentSemester' && o.available)
      if (current) setFilter(current.filter)
    })
  }, [version])

  useEffect(() => {
    let active = true
    getSchoolProfile().then(async (profile) => {
      if (!active || !profile?.upperSecondary || !hasVerifiedAbiRules(profile.state)) {
        if (active) setAbiImpact([])
        return
      }
      const rows = await calculateAbiImpactPerSubject()
      if (active) setAbiImpact(rows)
    })
    return () => {
      active = false
    }
  }, [version])

  const effectiveFilter: AnalysisDateFilter = useMemo(
    () => (filter.kind === 'custom' ? { kind: 'custom', from: customFrom, to: customTo } : filter),
    [filter, customFrom, customTo],
  )

  useEffect(() => {
    let active = true
    setLoading(true)

    resolveEntryFilter(effectiveFilter).then((entryFilter) => {
      const detailWork: Promise<
        [TrendPoint[], CategoryTypeAverage[], WrittenVsOralResult | null, ConsistencyResult | null, ActivityBreakdown | null, StreakResult | null, RecentEntryView[]]
      > = entryFilter
        ? Promise.all([
            calculatePerformanceHistory(entryFilter),
            calculateCategoryPerformance(entryFilter),
            calculateWrittenVsOralStats(entryFilter),
            calculateOverallConsistency(entryFilter),
            calculateActivity(entryFilter),
            calculateRecentStreak(entryFilter),
            getRecentEntries(entryFilter, 6),
          ])
        : Promise.resolve([[], [], null, null, null, null, []])

      Promise.all([
        getStatsForFilter(effectiveFilter),
        getOverallScoreDeltaLast30Days(),
        getMostImprovedSubject(),
        getSchoolYearSemesterComparison(),
        getGlobalInsights(),
        detailWork,
      ]).then(([s, delta, improved, comparison, insights, detail]) => {
        if (!active) return
        setStats(s)
        setScoreDelta(delta)
        setMostImproved(improved)
        setSemesterComparison(comparison)
        setGlobalInsights(insights)
        const [historyPoints, catPerf, writtenOral, cons, act, str, recent] = detail
        setHistory(historyPoints)
        setCategoryPerformance(catPerf)
        setWrittenVsOral(writtenOral)
        setConsistency(cons)
        setActivity(act)
        setStreak(str)
        setRecentEntries(recent)
        setLoading(false)
      })
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
      <div className="mx-auto w-full max-w-md space-y-4 md:max-w-2xl">
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
  const weakest = ranked.length > 1 ? ranked[ranked.length - 1] : null
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
    <div className="mx-auto w-full max-w-md space-y-6 md:max-w-2xl">
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
            <p className="text-xs font-medium text-ink-faint">Bestes Fach</p>
            {strongest && strongest.average.value !== null && strongest.average.scale !== null ? (
              <>
                <p className="truncate text-sm font-semibold text-ink">{strongest.subject.name}</p>
                <p className="text-sm text-ink-soft">{formatGradeValue(strongest.average.value, strongest.average.scale)}</p>
              </>
            ) : (
              <p className="text-sm text-ink-faint">–</p>
            )}
          </Card>
          <ImprovementPotentialTile subject={weakest} />
          <MostImprovedTile result={mostImproved} />
        </div>
      </div>

      {history.length >= 2 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Notenentwicklung</p>
          <Card>
            <TrendChart points={history} />
          </Card>
        </div>
      )}

      <AttentionSection subjects={attentionSubjects} />

      {ranked.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Fächer im Vergleich</p>
          <RankedSubjectBars subjects={ranked} />
        </div>
      )}

      <AbiImpactSection rows={abiImpact} />

      {categoryPerformance.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Notenarten</p>
          <CategoryPerformanceBars categories={categoryPerformance} />
        </div>
      )}

      {writtenVsOral && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Schriftlich vs. mündlich</p>
          <WrittenVsOralCard result={writtenVsOral} />
        </div>
      )}

      {distribution && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Notenverteilung</p>
          <Card>
            <DistributionChart buckets={distribution} />
          </Card>
        </div>
      )}

      <ConsistencyActivityRow consistency={consistency} activity={activity} streak={streak} />

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

      {recentEntries.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
            <Activity className="h-4 w-4" strokeWidth={2} />
            Letzte Leistungen
          </p>
          <RecentEntriesList entries={recentEntries} />
        </div>
      )}
    </div>
  )
}
