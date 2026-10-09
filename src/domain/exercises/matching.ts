import type { EntityId } from '@/domain/common/types'
import type { Exercise } from './Exercise'

/** Um exercício pertence a uma estrutura pelo vínculo principal ou por qualquer alvo cadastrado. */
export function exerciseMatchesStructure(exercise: Exercise, structureId: EntityId): boolean {
  if (exercise.anatomicalStructureId === structureId) return true
  return (exercise.targets ?? []).some((target) => target.anatomicalStructureId === structureId)
}
