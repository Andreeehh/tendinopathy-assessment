import type { EntityId } from '@/domain/common/types'

export type PainScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10
export type PainLevel = 'low' | 'moderate' | 'high'
export type AssessmentStatus = 'in-progress' | 'completed' | 'cancelled'

export interface PainArea {
  /** @deprecated Derived from the selected anatomical structure. */
  bodyRegionId?: EntityId
  anatomicalStructureId?: EntityId
  side?: 'left' | 'right' | 'both' | 'not-applicable'
  face?: 'anterior' | 'posterior'
}

export interface PainAssessmentSession {
  id: EntityId
  userId?: EntityId
  status: AssessmentStatus
  painArea: PainArea
  initialPainScore: PainScore
  painLevel: PainLevel
  startedAt: string
  completedAt?: string
}

export interface PainEvaluationResponse {
  id: EntityId
  sessionId: EntityId
  exerciseId: EntityId
  painBefore: PainScore
  painAfter?: PainScore
  completed: boolean
  notes?: string
  answeredAt: string
}

export interface PainAssessmentResult {
  sessionId: EntityId
  finalPainScore: PainScore
  painLevel: PainLevel
  completedEvaluationCount: number
  totalEvaluationCount: number
  completedAt: string
}
