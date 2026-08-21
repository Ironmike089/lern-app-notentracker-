import type { SubjectStats } from '../../services/gradeStatsService'

const ATTENTION_GAP_THRESHOLD = 15
const ATTENTION_ABSOLUTE_THRESHOLD = 40

export function getAttentionSubjects(subjects: SubjectStats[], overallScore: number | null): SubjectStats[] {
  if (overallScore === null) return []
  return subjects.filter((s) => {
    if (s.performanceScore === null) return false
    return overallScore - s.performanceScore >= ATTENTION_GAP_THRESHOLD || s.performanceScore < ATTENTION_ABSOLUTE_THRESHOLD
  })
}
