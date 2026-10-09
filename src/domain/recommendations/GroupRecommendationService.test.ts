import { describe, expect, it } from 'vitest'
import type { ExerciseGroup } from '@/domain/exercise-groups'
import type { Exercise } from '@/domain/exercises'
import {
  createGroupRecommendationPlan,
  selectPlanGroup,
  summarizeGroupResult,
} from './GroupRecommendationService'

function therapeutic(id: string, structureId = 'shoulder'): Exercise {
  return {
    id,
    kind: 'therapeutic',
    anatomicalStructureId: structureId,
    name: id,
    slug: id,
    description: '',
    instructions: '',
    active: true,
    createdAt: '',
    updatedAt: '',
  }
}

function plan(id: string, minPain: number, maxPain: number, exerciseIds: string[], structureId = 'shoulder'): ExerciseGroup {
  return {
    id,
    kind: 'plan',
    name: `Plano ${id}`,
    slug: id,
    description: '',
    anatomicalStructureId: structureId,
    exerciseIds,
    minPain,
    maxPain,
    active: true,
    createdAt: '',
    updatedAt: '',
  }
}

const exercises = [therapeutic('a'), therapeutic('b'), therapeutic('c')]
const plans = [plan('low', 0, 3, ['a', 'b']), plan('mid', 4, 6, ['c'])]
const painArea = { anatomicalStructureId: 'shoulder' }

describe('summarizeGroupResult', () => {
  it('usa a maior dor da bateria e calcula média e completude', () => {
    const summary = summarizeGroupResult(
      [
        { exerciseId: 'e1', painScore: 2 },
        { exerciseId: 'e2', painScore: 5 },
      ],
      3,
    )
    expect(summary).toMatchObject({ maxPain: 5, averagePain: 3.5, answeredCount: 2, totalCount: 3, complete: false, worstExerciseId: 'e2' })
  })

  it('marca como completo quando todos foram respondidos', () => {
    expect(summarizeGroupResult([{ exerciseId: 'e1', painScore: 1 }], 1).complete).toBe(true)
  })

  it('lida com bateria sem respostas', () => {
    expect(summarizeGroupResult([], 2)).toMatchObject({ maxPain: 0, answeredCount: 0, complete: false })
  })
})

describe('selectPlanGroup', () => {
  const summary = (maxPain: number) => summarizeGroupResult([{ exerciseId: 'e', painScore: maxPain as 0 }], 1)

  it('escolhe o plano cuja faixa contém a maior dor', () => {
    expect(selectPlanGroup(plans, 'shoulder', summary(2))?.id).toBe('low')
    expect(selectPlanGroup(plans, 'shoulder', summary(5))?.id).toBe('mid')
  })

  it('respeita os limites inclusivos da faixa', () => {
    expect(selectPlanGroup(plans, 'shoulder', summary(3))?.id).toBe('low')
    expect(selectPlanGroup(plans, 'shoulder', summary(4))?.id).toBe('mid')
  })

  it('ignora planos de outra estrutura, inativos ou sem faixa correspondente', () => {
    expect(selectPlanGroup(plans, 'knee', summary(2))).toBeUndefined()
    expect(selectPlanGroup([{ ...plans[0], active: false }], 'shoulder', summary(2))).toBeUndefined()
    expect(selectPlanGroup(plans, 'shoulder', summary(6.5 as 6))).toBeUndefined()
  })

  it('prefere a faixa mais estreita quando há sobreposição', () => {
    const wide = plan('wide', 0, 10, ['a'])
    expect(selectPlanGroup([wide, plans[0]], 'shoulder', summary(2))?.id).toBe('low')
  })
})

describe('createGroupRecommendationPlan', () => {
  it('recomenda os exercícios do plano escolhido, na ordem cadastrada', () => {
    const result = createGroupRecommendationPlan({
      results: [
        { exerciseId: 'e1', painScore: 1 },
        { exerciseId: 'e2', painScore: 2 },
      ],
      totalCount: 2,
      painArea,
      plans,
      exercises,
    })
    expect(result.planName).toBe('Plano low')
    expect(result.recommendations.map((item) => item.exercise.id)).toEqual(['a', 'b'])
    expect(result.recommendations.map((item) => item.rank)).toEqual([1, 2])
  })

  it('o resultado completo da bateria define o plano: uma dor maior muda a recomendação', () => {
    const result = createGroupRecommendationPlan({
      results: [
        { exerciseId: 'e1', painScore: 1 },
        { exerciseId: 'e2', painScore: 5 },
      ],
      totalCount: 2,
      painArea,
      plans,
      exercises,
    })
    expect(result.planName).toBe('Plano mid')
    expect(result.recommendations.map((item) => item.exercise.id)).toEqual(['c'])
    expect(result.groupSummary?.maxPain).toBe(5)
  })

  it('bloqueia o plano quando alguma dor da bateria é alta', () => {
    const result = createGroupRecommendationPlan({
      results: [
        { exerciseId: 'e1', painScore: 1 },
        { exerciseId: 'e2', painScore: 8 },
      ],
      totalCount: 2,
      painArea,
      plans,
      exercises,
    })
    expect(result.recommendations).toHaveLength(0)
    expect(result.requiresProfessionalGuidance).toBe(true)
  })

  it('encaminha quando há sinal de alerta, mesmo com dor baixa', () => {
    const result = createGroupRecommendationPlan({
      results: [{ exerciseId: 'e1', painScore: 0 }],
      totalCount: 1,
      painArea,
      plans,
      exercises,
      alertSigns: ['Formigamento'],
    })
    expect(result.requiresProfessionalGuidance).toBe(true)
    expect(result.safetyMessage).toContain('Formigamento')
    expect(result.recommendations).toHaveLength(0)
  })

  it('ignora exercícios do plano que foram desativados ou não são terapêuticos', () => {
    const result = createGroupRecommendationPlan({
      results: [{ exerciseId: 'e1', painScore: 1 }],
      totalCount: 1,
      painArea,
      plans,
      exercises: [{ ...exercises[0], active: false }, exercises[1]],
    })
    expect(result.recommendations.map((item) => item.exercise.id)).toEqual(['b'])
  })

  it('sem plano cadastrado para a faixa, usa a regra por estrutura como contingência', () => {
    const result = createGroupRecommendationPlan({
      results: [{ exerciseId: 'e1', painScore: 2 }],
      totalCount: 1,
      painArea,
      plans: [],
      exercises,
    })
    expect(result.planName).toBeUndefined()
    expect(result.recommendations.length).toBeGreaterThan(0)
  })
})
