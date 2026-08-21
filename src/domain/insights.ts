import { isHigherBetter, performanceScore } from './grading'
import { computeSubjectTrend, type TrendEntryInput } from './analytics'
import type { GradingScale } from './types'

/**
 * Small, regelbasierte (rule-based) insights — no LLM, no invented data.
 * Every sentence is generated from an explicit, testable rule and stays
 * factual rather than judgmental (never "du bist schlecht in X").
 */

export interface Insight {
  id: string
  text: string
}

export interface InsightEntryInput {
  value: number
  weight: number
  scale: GradingScale
  date: string
}

export interface InsightCategoryInput {
  id: string
  name: string
  weight: number
  entries: InsightEntryInput[]
}

const RECENT_STREAK_MIN_TOTAL = 4
const TREND_MIN_SCORE_DELTA = 2
const ORAL_WRITTEN_MIN_SCORE_DELTA = 3

function classifyCategory(name: string): 'oral' | 'written' | null {
  const n = name.toLowerCase()
  if (n.includes('mündlich') || n.includes('beteiligung')) return 'oral'
  if (
    n.includes('schulaufgabe') ||
    n.includes('kurzarbeit') ||
    n.includes('klausur') ||
    n.includes('test') ||
    n.includes('schriftlich')
  ) {
    return 'written'
  }
  return null
}

function allSameScale(entries: { scale: GradingScale }[]): GradingScale | null {
  if (entries.length === 0) return null
  const scale = entries[0].scale
  return entries.every((e) => e.scale === scale) ? scale : null
}

function insightRecentStreak(subjectName: string, categories: InsightCategoryInput[]): Insight | null {
  const allEntries = categories.flatMap((c) => c.entries)
  if (allEntries.length < RECENT_STREAK_MIN_TOTAL) return null

  const scale = allSameScale(allEntries)
  if (!scale) return null

  const sorted = [...allEntries].sort((a, b) => a.date.localeCompare(b.date))
  const recent = sorted.slice(-3)
  const prior = sorted.slice(0, -3)
  if (prior.length === 0) return null

  const recentAvg = recent.reduce((sum, e) => sum + e.value, 0) / recent.length
  const priorAvg = prior.reduce((sum, e) => sum + e.value, 0) / prior.length
  const better = isHigherBetter(scale) ? recentAvg > priorAvg : recentAvg < priorAvg
  if (!better) return null

  return {
    id: 'recent-streak',
    text: `Deine letzten drei Leistungen in ${subjectName} lagen über deinem bisherigen Schnitt.`,
  }
}

/** Also the source of the explicit "noch nicht genug Daten" case from the spec. */
function insightSemesterTrend(subjectName: string, categories: InsightCategoryInput[]): Insight | null {
  const trendEntries: TrendEntryInput[] = categories.flatMap((c) =>
    c.entries.map((e) => ({
      categoryId: c.id,
      categoryWeight: c.weight,
      value: e.value,
      weight: e.weight,
      scale: e.scale,
      date: e.date,
    })),
  )
  if (trendEntries.length === 0) return null

  const points = computeSubjectTrend(trendEntries)
  if (points.length < 2) {
    return { id: 'trend-insufficient', text: `In ${subjectName} fehlen noch Daten für einen Trend.` }
  }

  const delta = points[points.length - 1].score - points[0].score
  if (Math.abs(delta) < TREND_MIN_SCORE_DELTA) return null

  return {
    id: 'trend',
    text:
      delta > 0
        ? `${subjectName} hat sich dieses Halbjahr verbessert.`
        : `${subjectName} hat sich dieses Halbjahr verschlechtert.`,
  }
}

function insightOralVsWritten(subjectName: string, categories: InsightCategoryInput[]): Insight | null {
  const oral = categories.filter((c) => classifyCategory(c.name) === 'oral').flatMap((c) => c.entries)
  const written = categories.filter((c) => classifyCategory(c.name) === 'written').flatMap((c) => c.entries)
  if (oral.length === 0 || written.length === 0) return null

  const scale = allSameScale([...oral, ...written])
  if (!scale) return null

  const oralScore = oral.reduce((sum, e) => sum + performanceScore(e.value, scale), 0) / oral.length
  const writtenScore = written.reduce((sum, e) => sum + performanceScore(e.value, scale), 0) / written.length
  if (Math.abs(oralScore - writtenScore) < ORAL_WRITTEN_MIN_SCORE_DELTA) return null

  return {
    id: 'oral-vs-written',
    text:
      oralScore > writtenScore
        ? `Deine mündlichen Leistungen in ${subjectName} sind aktuell stärker als deine schriftlichen.`
        : `Deine schriftlichen Leistungen in ${subjectName} sind aktuell stärker als deine mündlichen.`,
  }
}

export function computeSubjectInsights(subjectName: string, categories: InsightCategoryInput[]): Insight[] {
  return [
    insightRecentStreak(subjectName, categories),
    insightSemesterTrend(subjectName, categories),
    insightOralVsWritten(subjectName, categories),
  ].filter((i): i is Insight => i !== null)
}
