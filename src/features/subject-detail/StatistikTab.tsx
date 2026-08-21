import { useEffect, useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { isHigherBetter } from '../../domain/grading'
import type { DistributionBucket, TrendPoint } from '../../domain/analytics'
import type { Insight } from '../../domain/insights'
import type { Subject } from '../../domain/types'
import {
  getSubjectDistribution,
  getSubjectInsights,
  getSubjectTrendSeries,
  type SubjectStats,
} from '../../services/gradeStatsService'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { TrendChart } from '../../components/ui/TrendChart'
import { DistributionChart } from '../../components/ui/DistributionChart'
import { InsightsList } from '../../components/ui/InsightsList'

interface StatistikTabProps {
  subject: Subject
  stats: SubjectStats
  semesterId: string
}

export function StatistikTab({ subject, stats, semesterId }: StatistikTabProps) {
  const allEntries = stats.categories.flatMap((c) => c.entries)

  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [distribution, setDistribution] = useState<DistributionBucket[] | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loadingExtras, setLoadingExtras] = useState(true)

  useEffect(() => {
    if (allEntries.length === 0) {
      setLoadingExtras(false)
      return
    }
    let active = true
    setLoadingExtras(true)
    Promise.all([
      getSubjectTrendSeries(subject, semesterId),
      getSubjectDistribution(subject, semesterId),
      getSubjectInsights(subject, semesterId),
    ]).then(([trendPoints, dist, subjectInsights]) => {
      if (!active) return
      setTrend(trendPoints)
      setDistribution(dist?.buckets ?? null)
      setInsights(subjectInsights)
      setLoadingExtras(false)
    })
    return () => {
      active = false
    }
    // allEntries.length is a stable proxy for "this subject's data changed" within one stats snapshot
  }, [subject, semesterId, allEntries.length])

  if (allEntries.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-5 w-5" strokeWidth={1.75} />}
        title="Noch keine Statistik"
        description="Sobald du Noten einträgst, siehst du hier eine Übersicht."
      />
    )
  }

  const scale = stats.average.scale
  const values = allEntries.map((e) => e.value)
  const best = scale && isHigherBetter(scale) ? Math.max(...values) : Math.min(...values)
  const weak = scale && isHigherBetter(scale) ? Math.min(...values) : Math.max(...values)

  const enabledCategories = stats.categories.filter((c) => c.category.enabled)
  const weightSum = enabledCategories.reduce((sum, c) => sum + c.category.weight, 0)

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Card className="flex-1 space-y-1">
          <p className="text-xs font-medium text-ink-faint">Leistungen</p>
          <p className="text-2xl font-bold text-ink">{allEntries.length}</p>
        </Card>
        {scale && (
          <>
            <Card className="flex-1 space-y-1">
              <p className="text-xs font-medium text-ink-faint">Beste Einzelnote</p>
              <p className="text-2xl font-bold text-perf-excellent">{best}</p>
            </Card>
            <Card className="flex-1 space-y-1">
              <p className="text-xs font-medium text-ink-faint">Schwächste</p>
              <p className="text-2xl font-bold text-ink-soft">{weak}</p>
            </Card>
          </>
        )}
      </div>

      {!loadingExtras && trend.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Verlauf</p>
          <Card>
            <TrendChart points={trend} />
          </Card>
        </div>
      )}

      {!loadingExtras && insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Beobachtungen</p>
          <InsightsList insights={insights} />
        </div>
      )}

      {!loadingExtras && distribution && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink-soft">Verteilung</p>
          <Card>
            <DistributionChart buckets={distribution} />
          </Card>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-semibold text-ink-soft">Gewichtung der Kategorien</p>
        <Card className="space-y-3">
          {enabledCategories.map((c) => {
            const percent = weightSum > 0 ? Math.round((c.category.weight / weightSum) * 100) : 0
            return (
              <div key={c.category.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-soft">{c.category.name}</span>
                  <span className="text-ink-faint">{percent}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-bg-raised">
                  <div
                    className="h-full rounded-full bg-mint transition-[width] duration-[220ms] ease-out"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </div>
  )
}
