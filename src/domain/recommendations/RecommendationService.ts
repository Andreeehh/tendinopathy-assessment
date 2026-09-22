import type { Exercise } from '@/domain/exercises'
import { classifyPainScore } from '@/domain/pain-assessment'
import type { PainArea, PainScore } from '@/domain/pain-assessment'
import type { RecommendationPlan } from './ExerciseRecommendation'

export interface RecommendationRequest {
  painScore: PainScore
  painArea: PainArea
  exercises: Exercise[]
  sessionId?: string
}

export function createRecommendationPlan({
  painScore,
  painArea,
  exercises,
  sessionId,
}: RecommendationRequest): RecommendationPlan {
  const painLevel = classifyPainScore(painScore)
  const matchingExercises = exercises.filter(
    (exercise) =>
      exercise.active &&
      exercise.kind === 'therapeutic' &&
      (!painArea.anatomicalStructureId ||
        (exercise.targets ?? [{
          anatomicalStructureId: exercise.anatomicalStructureId,
        }]).some((target) =>
          target.anatomicalStructureId === painArea.anatomicalStructureId &&
          (target.allPlacements ||
            !target.placement ||
            !painArea.face ||
            (target.placement.face === painArea.face &&
              (!painArea.side || target.placement.side === painArea.side))),
        )),
  )

  if (painLevel === 'high') {
    return {
      painScore,
      painLevel,
      canStartExercises: false,
      requiresProfessionalGuidance: true,
      safetyMessage:
        'Para dor intensa (7 a 10), interrompa a avaliação e procure orientação profissional.',
      recommendations: [],
      sessionId,
    }
  }

  const limit = painLevel === 'low' ? 3 : 2
  return {
    painScore,
    painLevel,
    canStartExercises: matchingExercises.length > 0,
    requiresProfessionalGuidance: false,
    recommendations: matchingExercises.slice(0, limit).map((exercise, index) => ({
      exercise,
      rank: index + 1,
      reason:
        painLevel === 'low'
          ? 'Exercício ativo compatível com a área selecionada.'
          : 'Exercício ativo compatível, com volume reduzido para dor moderada.',
    })),
    sessionId,
  }
}
