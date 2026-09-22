import type { PainLevel, PainScore } from './PainAssessment'

export function classifyPainScore(score: PainScore): PainLevel {
  if (score <= 3) return 'low'
  if (score <= 6) return 'moderate'
  return 'high'
}
