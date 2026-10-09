import { describe, expect, it } from 'vitest'
import { getYoutubeEmbedUrl, isValidYoutubeUrl } from '@/domain/exercises'
import { selectPlanGroup, summarizeGroupResult } from '@/domain/recommendations'
import { anatomicalStructuresMock } from './anatomical-structures/anatomicalStructures.mock'
import { exerciseGroupsMock } from './exercise-groups/exerciseGroups.mock'
import { exercisesMock, seedVideoUrl } from './exercises/exercises.mock'
import { painTypesMock } from './pain-types/painTypes.mock'

const structureIds = anatomicalStructuresMock.map((structure) => structure.id)
const exerciseById = new Map(exercisesMock.map((exercise) => [exercise.id, exercise]))
const painTypeIds = new Set(painTypesMock.map((painType) => painType.id))
const alertIds = painTypesMock.filter((painType) => painType.isAlertSign).map((painType) => painType.id)

describe('seed do escopo v2', () => {
  it('cobre as 5 regiões do escopo', () => {
    expect(structureIds.sort()).toEqual(['ankle', 'elbow', 'gluteus', 'knee', 'shoulder'])
  })

  it.each(structureIds)('%s tem ao menos 2 exercícios avaliativos e 2 terapêuticos ativos', (structureId) => {
    const forStructure = exercisesMock.filter((exercise) => exercise.anatomicalStructureId === structureId && exercise.active)
    expect(forStructure.filter((exercise) => exercise.kind === 'evaluation').length).toBeGreaterThanOrEqual(2)
    expect(forStructure.filter((exercise) => exercise.kind === 'therapeutic').length).toBeGreaterThanOrEqual(2)
  })

  it('todos os exercícios do seed têm vídeo do YouTube válido', () => {
    for (const exercise of exercisesMock) {
      expect(exercise.youtubeUrl, exercise.id).toBe(seedVideoUrl)
      expect(isValidYoutubeUrl(exercise.youtubeUrl ?? ''), exercise.id).toBe(true)
      expect(getYoutubeEmbedUrl(exercise.youtubeUrl ?? ''), exercise.id).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ')
    }
  })

  it('usa ids e slugs únicos', () => {
    expect(new Set(exercisesMock.map((exercise) => exercise.id)).size).toBe(exercisesMock.length)
    expect(new Set(exercisesMock.map((exercise) => exercise.slug)).size).toBe(exercisesMock.length)
    expect(new Set(exerciseGroupsMock.map((group) => group.id)).size).toBe(exerciseGroupsMock.length)
    expect(new Set(exerciseGroupsMock.map((group) => group.slug)).size).toBe(exerciseGroupsMock.length)
  })

  it('referencia apenas estruturas, tipos de dor e progressões que existem', () => {
    for (const exercise of exercisesMock) {
      expect(structureIds).toContain(exercise.anatomicalStructureId)
      for (const painTypeId of exercise.painTypeIds ?? []) expect(painTypeIds.has(painTypeId)).toBe(true)
      for (const linked of [exercise.progressionExerciseId, exercise.regressionExerciseId]) {
        if (linked) expect(exerciseById.has(linked)).toBe(true)
      }
    }
  })

  it('todo exercício avaliativo oferece os sinais de alerta do escopo', () => {
    for (const exercise of exercisesMock.filter((item) => item.kind === 'evaluation')) {
      for (const alertId of alertIds) expect(exercise.painTypeIds).toContain(alertId)
      expect(exercise.allowOtherPainDescription).toBe(true)
    }
  })

  it('exercícios terapêuticos seguem a prescrição da seção 9', () => {
    const therapeutic = exercisesMock.filter((exercise) => exercise.kind === 'therapeutic')
    for (const exercise of therapeutic) {
      expect(exercise.targetEffort).toBe(7)
      expect(exercise.painLimit).toBe(4)
      expect(exercise.sets).toBeGreaterThanOrEqual(3)
      expect(exercise.restSeconds).toBeGreaterThan(0)
      expect(exercise.nextDayGuidance).toBeTruthy()
    }
    for (const exercise of therapeutic.filter((item) => item.phase === 1)) {
      expect(exercise.stimulus).toBe('isometric')
      expect(exercise.durationSeconds).toBe(45)
    }
    for (const exercise of therapeutic.filter((item) => item.phase === 2)) {
      expect(exercise.stimulus).toBe('hsr')
      expect(exercise.cadence).toBe('3 s subindo / 3 s descendo')
      expect(exercise.sets).toBe(4)
      expect(exercise.restSeconds).toBe(180)
    }
  })

  it('progressão e regressão ligam isometria (Fase 1) a HSR (Fase 2)', () => {
    for (const exercise of exercisesMock) {
      if (exercise.progressionExerciseId) {
        expect(exercise.phase).toBe(1)
        expect(exerciseById.get(exercise.progressionExerciseId)?.phase).toBe(2)
      }
      if (exercise.regressionExerciseId) {
        expect(exercise.phase).toBe(2)
        expect(exerciseById.get(exercise.regressionExerciseId)?.phase).toBe(1)
      }
    }
  })

  it('os grupos contêm só exercícios do tipo e da estrutura certos', () => {
    for (const group of exerciseGroupsMock) {
      expect(group.exerciseIds.length).toBeGreaterThan(0)
      for (const exerciseId of group.exerciseIds) {
        const exercise = exerciseById.get(exerciseId)
        expect(exercise, `${group.id} → ${exerciseId}`).toBeDefined()
        expect(exercise?.anatomicalStructureId).toBe(group.anatomicalStructureId)
        expect(exercise?.kind).toBe(group.kind === 'evaluation' ? 'evaluation' : 'therapeutic')
      }
    }
  })

  it.each(structureIds)('%s tem bateria ativa e plano da Fase 1 para toda dor de 0 a 6', (structureId) => {
    expect(
      exerciseGroupsMock.some((group) => group.kind === 'evaluation' && group.active && group.anatomicalStructureId === structureId),
    ).toBe(true)

    const plans = exerciseGroupsMock.filter((group) => group.kind === 'plan')
    for (let pain = 0; pain <= 6; pain += 1) {
      const selected = selectPlanGroup(plans, structureId, summarizeGroupResult([{ exerciseId: 'x', painScore: pain as 0 }], 1))
      expect(selected?.id, `dor ${pain}`).toBe(`${structureId}-plan-phase-1`)
    }
  })

  it('o plano da Fase 2 fica inativo e não é indicado pela avaliação inicial', () => {
    const phaseTwo = exerciseGroupsMock.filter((group) => group.id.endsWith('-plan-phase-2'))
    expect(phaseTwo).toHaveLength(structureIds.length)
    expect(phaseTwo.every((group) => !group.active)).toBe(true)
    for (const group of phaseTwo) {
      expect(group.exerciseIds.map((id) => exerciseById.get(id)?.phase)).toContain(2)
    }
  })
})
