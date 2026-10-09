import type { TreatmentPhase } from './types'

export type TreatmentAction = 'refer' | 'adjust' | 'advance' | 'maintain' | 'complete'

/** Limiares do escopo v2. Devem ser editáveis pelo admin e validados clinicamente. */
export interface RuleThresholds {
  /** Dor máxima tolerada durante o exercício. */
  maxPainDuringExercise: number
  /** Fase 1 → 2: dor na reavaliação deve ser menor que este valor. */
  advancePhase1BelowPain: number
  /** Fase 2 → 3: dor na reavaliação deve ser menor que este valor. */
  advancePhase2BelowPain: number
  /** Fase 3 → 4: dor na reavaliação deve ser menor que este valor (1 = sem dor). */
  advancePhase3BelowPain: number
  /** Conclusão da Fase 4: dor na reavaliação deve ser menor que este valor (1 = 0/10). */
  completePhase4BelowPain: number
}

export const defaultRuleThresholds: RuleThresholds = {
  maxPainDuringExercise: 4,
  advancePhase1BelowPain: 5,
  advancePhase2BelowPain: 3,
  advancePhase3BelowPain: 1,
  completePhase4BelowPain: 1,
}

export interface TreatmentEvaluationInput {
  phase: TreatmentPhase
  /** Sinais de alerta identificados (anamnese, tipos de dor de alerta, novos sintomas). */
  alertSigns: string[]
  persistentWorsening?: boolean
  painDuringExercise?: number
  /** Limite específico do exercício; se ausente, usa o limiar global. */
  exercisePainLimit?: number
  nextDayPainWorse?: boolean
  executionDifficulty?: boolean
  isReassessment: boolean
  reassessmentPain?: number
  sustainedWorsening?: boolean
  tolerated?: boolean
  functionalImprovement?: boolean
  returnFunctionAdequate?: boolean
}

export interface TreatmentDecision {
  action: TreatmentAction
  ruleId: string
  reason: string
  nextPhase?: TreatmentPhase
}

export function evaluateTreatmentDecision(
  input: TreatmentEvaluationInput,
  thresholds: RuleThresholds = defaultRuleThresholds,
): TreatmentDecision {
  if (input.alertSigns.length > 0) {
    return {
      action: 'refer',
      ruleId: 'R1-alert-sign',
      reason: `Sinal de alerta identificado: ${input.alertSigns.join(', ')}. Interrompa o fluxo automático e procure avaliação presencial.`,
    }
  }

  if (input.persistentWorsening) {
    return {
      action: 'refer',
      ruleId: 'R2-persistent-worsening',
      reason: 'Piora persistente ou evolução incompatível com o esperado. Procure avaliação presencial.',
    }
  }

  const painLimit = input.exercisePainLimit ?? thresholds.maxPainDuringExercise
  if (
    (input.painDuringExercise !== undefined && input.painDuringExercise > painLimit) ||
    input.nextDayPainWorse ||
    input.executionDifficulty
  ) {
    return {
      action: 'adjust',
      ruleId: 'R3-excess-load',
      reason: 'Dor acima do limite durante o exercício, piora no dia seguinte ou dificuldade de execução. Reduza carga, amplitude ou complexidade.',
    }
  }

  if (input.isReassessment && input.reassessmentPain !== undefined) {
    const pain = input.reassessmentPain
    const tolerated = input.tolerated !== false && !input.sustainedWorsening

    if (input.phase === 1 && pain < thresholds.advancePhase1BelowPain && tolerated) {
      return advance(2, 'R4-phase1-to-2', 'Dor abaixo do critério e boa tolerância ao protocolo.')
    }
    if (input.phase === 2 && pain < thresholds.advancePhase2BelowPain && tolerated && input.functionalImprovement) {
      return advance(3, 'R5-phase2-to-3', 'Dor abaixo do critério, tolerância à carga e evolução funcional.')
    }
    if (input.phase === 3 && pain < thresholds.advancePhase3BelowPain && tolerated) {
      return advance(4, 'R6-phase3-to-4', 'Sem dor nos critérios e tolerância às demandas anteriores.')
    }
    if (input.phase === 4 && pain < thresholds.completePhase4BelowPain && input.returnFunctionAdequate) {
      return {
        action: 'complete',
        ruleId: 'R7-complete',
        reason: 'Dor 0/10 e retorno funcional adequado. Protocolo concluído.',
      }
    }
  }

  return {
    action: 'maintain',
    ruleId: 'R8-maintain',
    reason: 'Critério de progressão ainda não atingido. Mantenha a fase atual.',
  }
}

function advance(nextPhase: TreatmentPhase, ruleId: string, reason: string): TreatmentDecision {
  return { action: 'advance', ruleId, reason, nextPhase }
}
