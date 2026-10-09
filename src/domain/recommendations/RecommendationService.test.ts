import { describe, expect, it } from 'vitest'
import { createRecommendationPlan } from './RecommendationService'
import type { Exercise } from '@/domain/exercises'

const exercise: Exercise = {
  id: 'knee-strengthening',
  kind: 'therapeutic',
  anatomicalStructureId: 'knee',
  name: 'Fortalecimento de joelho',
  slug: 'fortalecimento-de-joelho',
  description: '',
  instructions: '',
  active: true,
  createdAt: '',
  updatedAt: '',
}

describe('createRecommendationPlan', () => {
  it('recomenda exercícios terapêuticos para dor baixa', () => {
    const plan = createRecommendationPlan({
      painScore: 2,
      painArea: { anatomicalStructureId: 'knee' },
      exercises: [exercise],
    })
    expect(plan.recommendations).toHaveLength(1)
    expect(plan.requiresProfessionalGuidance).toBe(false)
  })

  it('bloqueia recomendação para dor alta', () => {
    const plan = createRecommendationPlan({
      painScore: 8,
      painArea: { anatomicalStructureId: 'knee' },
      exercises: [exercise],
    })
    expect(plan.recommendations).toHaveLength(0)
    expect(plan.requiresProfessionalGuidance).toBe(true)
  })

  it('encaminha quando o usuário marca um tipo de dor de alerta', () => {
    const plan = createRecommendationPlan({
      painScore: 1,
      painArea: { anatomicalStructureId: 'knee' },
      exercises: [exercise],
      alertSigns: ['Perda súbita de força'],
    })
    expect(plan.canStartExercises).toBe(false)
    expect(plan.requiresProfessionalGuidance).toBe(true)
    expect(plan.safetyMessage).toContain('Perda súbita de força')
  })
})
