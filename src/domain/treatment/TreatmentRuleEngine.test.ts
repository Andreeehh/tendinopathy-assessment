import { describe, expect, it } from 'vitest'
import {
  defaultRuleThresholds,
  evaluateTreatmentDecision,
} from './TreatmentRuleEngine'
import type { TreatmentEvaluationInput } from './TreatmentRuleEngine'

const base: TreatmentEvaluationInput = {
  phase: 1,
  alertSigns: [],
  isReassessment: false,
}

describe('evaluateTreatmentDecision', () => {
  it('R1: encaminha quando há sinal de alerta, mesmo com tudo o mais favorável', () => {
    const decision = evaluateTreatmentDecision({
      ...base,
      alertSigns: ['Formigamento'],
      isReassessment: true,
      reassessmentPain: 0,
    })
    expect(decision.action).toBe('refer')
    expect(decision.ruleId).toBe('R1-alert-sign')
  })

  it('R2: encaminha em piora persistente', () => {
    expect(evaluateTreatmentDecision({ ...base, persistentWorsening: true }).ruleId).toBe('R2-persistent-worsening')
  })

  it('R3: ajusta quando a dor durante o exercício passa de 4', () => {
    expect(evaluateTreatmentDecision({ ...base, painDuringExercise: 5 }).action).toBe('adjust')
  })

  it('R3: não ajusta com dor exatamente no limite', () => {
    expect(evaluateTreatmentDecision({ ...base, painDuringExercise: 4 }).action).toBe('maintain')
  })

  it('R3: respeita o limite de dor específico do exercício', () => {
    expect(evaluateTreatmentDecision({ ...base, painDuringExercise: 3, exercisePainLimit: 2 }).action).toBe('adjust')
  })

  it('R3: ajusta quando a dor do dia seguinte piora ou há dificuldade de execução', () => {
    expect(evaluateTreatmentDecision({ ...base, nextDayPainWorse: true }).action).toBe('adjust')
    expect(evaluateTreatmentDecision({ ...base, executionDifficulty: true }).action).toBe('adjust')
  })

  it('R3 tem prioridade sobre avançar na reavaliação', () => {
    const decision = evaluateTreatmentDecision({
      ...base,
      isReassessment: true,
      reassessmentPain: 1,
      nextDayPainWorse: true,
    })
    expect(decision.action).toBe('adjust')
  })

  it('R4: Fase 1 avança com dor < 5 e tolerância', () => {
    const decision = evaluateTreatmentDecision({ ...base, isReassessment: true, reassessmentPain: 4 })
    expect(decision).toMatchObject({ action: 'advance', nextPhase: 2 })
  })

  it('R4: Fase 1 mantém com dor 5', () => {
    expect(evaluateTreatmentDecision({ ...base, isReassessment: true, reassessmentPain: 5 }).action).toBe('maintain')
  })

  it('R4: Fase 1 não avança com piora sustentada', () => {
    const decision = evaluateTreatmentDecision({
      ...base,
      isReassessment: true,
      reassessmentPain: 2,
      sustainedWorsening: true,
    })
    expect(decision.action).toBe('maintain')
  })

  it('R5: Fase 2 exige dor < 3, tolerância e evolução funcional', () => {
    const input = { ...base, phase: 2 as const, isReassessment: true, reassessmentPain: 2, functionalImprovement: true }
    expect(evaluateTreatmentDecision(input)).toMatchObject({ action: 'advance', nextPhase: 3 })
    expect(evaluateTreatmentDecision({ ...input, functionalImprovement: false }).action).toBe('maintain')
    expect(evaluateTreatmentDecision({ ...input, reassessmentPain: 3 }).action).toBe('maintain')
  })

  it('R6: Fase 3 avança somente sem dor', () => {
    const input = { ...base, phase: 3 as const, isReassessment: true }
    expect(evaluateTreatmentDecision({ ...input, reassessmentPain: 0 })).toMatchObject({ action: 'advance', nextPhase: 4 })
    expect(evaluateTreatmentDecision({ ...input, reassessmentPain: 1 }).action).toBe('maintain')
  })

  it('R7: Fase 4 conclui com dor 0 e retorno funcional adequado', () => {
    const input = { ...base, phase: 4 as const, isReassessment: true, reassessmentPain: 0 }
    expect(evaluateTreatmentDecision({ ...input, returnFunctionAdequate: true }).action).toBe('complete')
    expect(evaluateTreatmentDecision(input).action).toBe('maintain')
  })

  it('R8: mantém fora de reavaliação quando não há gatilhos', () => {
    expect(evaluateTreatmentDecision(base).ruleId).toBe('R8-maintain')
  })

  it('usa limiares customizados', () => {
    const decision = evaluateTreatmentDecision(
      { ...base, isReassessment: true, reassessmentPain: 5 },
      { ...defaultRuleThresholds, advancePhase1BelowPain: 6 },
    )
    expect(decision.action).toBe('advance')
  })
})
