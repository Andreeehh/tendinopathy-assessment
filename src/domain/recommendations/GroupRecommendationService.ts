import type { EntityId } from '@/domain/common/types'
import type { ExerciseGroup } from '@/domain/exercise-groups'
import type { Exercise } from '@/domain/exercises'
import { classifyPainScore } from '@/domain/pain-assessment'
import type { PainArea, PainScore } from '@/domain/pain-assessment'
import type { GroupResultSummary, RecommendationPlan } from './ExerciseRecommendation'
import { createRecommendationPlan } from './RecommendationService'

export interface GroupExerciseResult {
  exerciseId: EntityId
  painScore: PainScore
}

/** Agrega as respostas da bateria: a maior dor registrada é o que direciona o plano. */
export function summarizeGroupResult(
  results: GroupExerciseResult[],
  totalCount: number,
): GroupResultSummary {
  if (results.length === 0) {
    return { maxPain: 0, averagePain: 0, answeredCount: 0, totalCount, complete: false }
  }
  const worst = results.reduce((current, item) => (item.painScore > current.painScore ? item : current))
  const sum = results.reduce((total, item) => total + item.painScore, 0)
  return {
    maxPain: worst.painScore,
    averagePain: Math.round((sum / results.length) * 10) / 10,
    answeredCount: results.length,
    totalCount,
    complete: results.length >= totalCount,
    worstExerciseId: worst.exerciseId,
  }
}

/**
 * Escolhe o plano ativo da estrutura cuja faixa de dor contém a maior dor da bateria.
 * Havendo mais de um, vence a faixa mais estreita (mais específica).
 */
export function selectPlanGroup(
  plans: ExerciseGroup[],
  structureId: EntityId,
  summary: GroupResultSummary,
): ExerciseGroup | undefined {
  return plans
    .filter((group) =>
      group.kind === 'plan' &&
      group.active &&
      group.anatomicalStructureId === structureId &&
      summary.maxPain >= (group.minPain ?? 0) &&
      summary.maxPain <= (group.maxPain ?? 10),
    )
    .sort((a, b) => {
      const widthA = (a.maxPain ?? 10) - (a.minPain ?? 0)
      const widthB = (b.maxPain ?? 10) - (b.minPain ?? 0)
      return widthA - widthB || a.name.localeCompare(b.name)
    })[0]
}

export interface GroupRecommendationRequest {
  results: GroupExerciseResult[]
  totalCount: number
  painArea: PainArea
  plans: ExerciseGroup[]
  exercises: Exercise[]
  sessionId?: string
  alertSigns?: string[]
}

export function createGroupRecommendationPlan({
  results,
  totalCount,
  painArea,
  plans,
  exercises,
  sessionId,
  alertSigns = [],
}: GroupRecommendationRequest): RecommendationPlan {
  const summary = summarizeGroupResult(results, totalCount)
  const painLevel = classifyPainScore(summary.maxPain)

  // Dor alta e sinais de alerta nunca recebem plano, independentemente dos grupos cadastrados.
  if (painLevel === 'high' || alertSigns.length > 0) {
    return {
      ...createRecommendationPlan({ painScore: summary.maxPain, painArea, exercises: [], sessionId, alertSigns }),
      groupSummary: summary,
    }
  }

  const structureId = painArea.anatomicalStructureId
  const plan = structureId ? selectPlanGroup(plans, structureId, summary) : undefined

  if (!plan) {
    return {
      ...createRecommendationPlan({ painScore: summary.maxPain, painArea, exercises, sessionId }),
      groupSummary: summary,
    }
  }

  const exerciseById = new Map(exercises.map((exercise) => [exercise.id, exercise]))
  const recommendations = plan.exerciseIds
    .map((id) => exerciseById.get(id))
    .filter((exercise): exercise is Exercise => Boolean(exercise && exercise.active && exercise.kind === 'therapeutic'))
    .map((exercise, index) => ({
      exercise,
      rank: index + 1,
      reason: `Faz parte do plano "${plan.name}" (maior dor na bateria: ${summary.maxPain}/10).`,
    }))

  return {
    painScore: summary.maxPain,
    painLevel,
    canStartExercises: recommendations.length > 0,
    requiresProfessionalGuidance: false,
    recommendations,
    sessionId,
    planName: plan.name,
    groupSummary: summary,
  }
}
