import type { EntityId } from '@/domain/common/types'
import type {
  PainAssessmentResult,
  PainAssessmentSession,
  PainEvaluationResponse,
  PainScore,
} from './PainAssessment'

export interface CreatePainAssessmentInput {
  userId?: EntityId
  painArea: PainAssessmentSession['painArea']
  initialPainScore: PainScore
}

export interface RecordEvaluationResponseInput {
  exerciseId: EntityId
  painDuring?: PainScore
  painBefore?: PainScore
  painAfter?: PainScore
  painTypeIds?: EntityId[]
  otherPainDescription?: string
  completed: boolean
  notes?: string
}

export interface PainAssessmentRepository {
  createSession(input: CreatePainAssessmentInput): Promise<PainAssessmentSession>
  getSession(id: EntityId): Promise<PainAssessmentSession | null>
  recordResponse(
    sessionId: EntityId,
    input: RecordEvaluationResponseInput,
  ): Promise<PainEvaluationResponse>
  listResponses(sessionId: EntityId): Promise<PainEvaluationResponse[]>
  completeSession(
    id: EntityId,
    finalPainScore: PainScore,
    totalEvaluationCount: number,
  ): Promise<PainAssessmentResult>
}
