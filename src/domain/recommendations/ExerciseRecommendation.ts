import type { EntityId } from '@/domain/common/types'
import type { Exercise } from '@/domain/exercises'
import type { PainLevel, PainScore } from '@/domain/pain-assessment'

export interface ExerciseRecommendation {
  exercise: Exercise
  rank: number
  reason: string
}

export interface GroupResultSummary {
  maxPain: PainScore
  averagePain: number
  answeredCount: number
  totalCount: number
  /** Verdadeiro quando todos os exercícios da bateria foram respondidos. */
  complete: boolean
  worstExerciseId?: EntityId
}

export interface RecommendationPlan {
  painScore: PainScore
  painLevel: PainLevel
  canStartExercises: boolean
  requiresProfessionalGuidance: boolean
  safetyMessage?: string
  recommendations: ExerciseRecommendation[]
  sessionId?: EntityId
  /** Nome do plano (grupo de exercícios terapêuticos) escolhido pelo resultado da bateria. */
  planName?: string
  groupSummary?: GroupResultSummary
}
