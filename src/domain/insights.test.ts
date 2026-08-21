import { describe, expect, it } from 'vitest'
import { computeSubjectInsights, type InsightCategoryInput } from './insights'

function category(overrides: Partial<InsightCategoryInput>): InsightCategoryInput {
  return { id: 'c1', name: 'Schulaufgaben', weight: 1, entries: [], ...overrides }
}

function e(value: number, date: string, scale: 'grade_1_6' | 'points_0_15' = 'grade_1_6') {
  return { value, weight: 1, scale, date }
}

describe('computeSubjectInsights', () => {
  it('flags a recent streak above the prior average (grade_1_6, lower is better)', () => {
    const categories = [
      category({
        entries: [e(4, '2026-01-01'), e(4, '2026-01-05'), e(1, '2026-02-01'), e(1, '2026-02-05'), e(1, '2026-02-10')],
      }),
    ]
    const insights = computeSubjectInsights('Englisch', categories)
    expect(insights.some((i) => i.id === 'recent-streak')).toBe(true)
  })

  it('does not claim a streak when the last three are not actually better', () => {
    const categories = [
      category({
        entries: [e(1, '2026-01-01'), e(1, '2026-01-05'), e(4, '2026-02-01'), e(4, '2026-02-05'), e(4, '2026-02-10')],
      }),
    ]
    const insights = computeSubjectInsights('Englisch', categories)
    expect(insights.some((i) => i.id === 'recent-streak')).toBe(false)
  })

  it('reports insufficient data for a trend when fewer than two points exist', () => {
    const categories = [category({ entries: [e(2, '2026-01-01')] })]
    const insights = computeSubjectInsights('Geschichte', categories)
    expect(insights).toContainEqual({ id: 'trend-insufficient', text: 'In Geschichte fehlen noch Daten für einen Trend.' })
  })

  it('reports no trend insight (and no fabricated data) when there are no entries at all', () => {
    const insights = computeSubjectInsights('Geschichte', [category({ entries: [] })])
    expect(insights.some((i) => i.id.startsWith('trend'))).toBe(false)
  })

  it('detects a semester-long improvement', () => {
    const categories = [
      category({
        entries: [e(5, '2026-01-01'), e(4, '2026-01-10'), e(2, '2026-02-01'), e(1, '2026-02-10')],
      }),
    ]
    const insights = computeSubjectInsights('Mathematik', categories)
    expect(insights).toContainEqual({ id: 'trend', text: 'Mathematik hat sich dieses Halbjahr verbessert.' })
  })

  it('detects a semester-long decline', () => {
    const categories = [
      category({
        entries: [e(1, '2026-01-01'), e(2, '2026-01-10'), e(4, '2026-02-01'), e(5, '2026-02-10')],
      }),
    ]
    const insights = computeSubjectInsights('Mathematik', categories)
    expect(insights).toContainEqual({ id: 'trend', text: 'Mathematik hat sich dieses Halbjahr verschlechtert.' })
  })

  it('compares oral vs written performance when both categories have data', () => {
    const categories = [
      category({ id: 'oral', name: 'Mündlich', entries: [e(1, '2026-01-01'), e(1, '2026-01-05')] }),
      category({ id: 'written', name: 'Schulaufgaben', entries: [e(5, '2026-01-01'), e(5, '2026-01-05')] }),
    ]
    const insights = computeSubjectInsights('Deutsch', categories)
    expect(insights).toContainEqual({
      id: 'oral-vs-written',
      text: 'Deine mündlichen Leistungen in Deutsch sind aktuell stärker als deine schriftlichen.',
    })
  })

  it('stays silent on oral-vs-written when only one side has data', () => {
    const categories = [category({ name: 'Mündlich', entries: [e(2, '2026-01-01')] })]
    const insights = computeSubjectInsights('Deutsch', categories)
    expect(insights.some((i) => i.id === 'oral-vs-written')).toBe(false)
  })

  it('never emits a judgmental statement — only the known factual templates', () => {
    const categories = [
      category({
        name: 'Mündlich',
        entries: [e(6, '2026-01-01'), e(6, '2026-01-05'), e(6, '2026-01-10'), e(6, '2026-01-15')],
      }),
    ]
    const insights = computeSubjectInsights('Mathematik', categories)
    for (const insight of insights) {
      expect(insight.text.toLowerCase()).not.toMatch(/schlecht|schwach bist|versagt/)
    }
  })
})
