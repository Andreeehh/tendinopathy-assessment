import type {
  CreatePainAssessmentInput,
  PainAssessmentRepository,
  RecordEvaluationResponseInput,
} from '@/domain/pain-assessment'
import type {
  PainAssessmentResult,
  PainAssessmentSession,
  PainEvaluationResponse,
} from '@/domain/pain-assessment'
import { classifyPainScore } from '@/domain/pain-assessment'

export class InMemoryPainAssessmentRepository implements PainAssessmentRepository {
  private readonly sessions: PainAssessmentSession[] = []
  private readonly responses: PainEvaluationResponse[] = []

  async createSession(input: CreatePainAssessmentInput) {
    const session: PainAssessmentSession = {
      id: `assessment-${Date.now()}`,
      userId: input.userId,
      status: 'in-progress',
      painArea: input.painArea,
      initialPainScore: input.initialPainScore,
      painLevel: classifyPainScore(input.initialPainScore),
      startedAt: new Date().toISOString(),
    }
    this.sessions.push(session)
    return session
  }

  async getSession(id: string) {
    return this.sessions.find((session) => session.id === id) ?? null
  }

  async recordResponse(
    sessionId: string,
    input: RecordEvaluationResponseInput,
  ) {
    const session = await this.getSession(sessionId)
    if (!session) throw new Error('Sessão de avaliação não encontrada.')
    if (session.status !== 'in-progress') {
      throw new Error('A sessão de avaliação não está em andamento.')
    }
    const response: PainEvaluationResponse = {
      id: `response-${Date.now()}-${this.responses.length}`,
      sessionId,
      ...input,
      answeredAt: new Date().toISOString(),
    }
    this.responses.push(response)
    return response
  }

  async listResponses(sessionId: string) {
    return this.responses.filter((response) => response.sessionId === sessionId)
  }

  async completeSession(
    id: string,
    finalPainScore: PainAssessmentSession['initialPainScore'],
    totalEvaluationCount: number,
  ): Promise<PainAssessmentResult> {
    const session = await this.getSession(id)
    if (!session) throw new Error('Sessão de avaliação não encontrada.')
    if (session.status !== 'in-progress') {
      throw new Error('A sessão de avaliação não está em andamento.')
    }
    const responses = await this.listResponses(id)
    const completedAt = new Date().toISOString()
    session.status = 'completed'
    session.completedAt = completedAt
    return {
      sessionId: id,
      finalPainScore,
      painLevel: classifyPainScore(finalPainScore),
      completedEvaluationCount: responses.filter((response) => response.completed).length,
      totalEvaluationCount,
      completedAt,
    }
  }
}

export const painAssessmentRepository = new InMemoryPainAssessmentRepository()
