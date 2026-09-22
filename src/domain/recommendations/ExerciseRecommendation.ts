import type { EntityId } from '@/domain/common/types'
import type { Exercise } from '@/domain/exercises'
import type { PainLevel, PainScore } from '@/domain/pain-assessment'

export interface ExerciseRecommendation {
  exercise: Exercise
  rank: number
  reason: string
}

export interface RecommendationPlan {
  painScore: PainScore
  painLevel: PainLevel
  canStartExercises: boolean
  requiresProfessionalGuidance: boolean
  safetyMessage?: string
  recommendations: ExerciseRecommendation[]
  sessionId?: EntityId
}
