import type { EntityId } from '@/domain/common/types'

/**
 * `evaluation`: bateria de exercícios avaliativos aplicada ao usuário.
 * `plan`: plano de exercícios terapêuticos, indicado quando o resultado da bateria cai na faixa de dor definida.
 */
export type ExerciseGroupKind = 'evaluation' | 'plan'

export interface ExerciseGroup {
  id: EntityId
  kind: ExerciseGroupKind
  name: string
  slug: string
  description: string
  anatomicalStructureId: EntityId
  /** Ordem de execução; define também a ordem de exibição. */
  exerciseIds: EntityId[]
  /** Apenas para planos: menor dor máxima da bateria (0–10) em que o plano se aplica. */
  minPain?: number
  /** Apenas para planos: maior dor máxima da bateria (0–10) em que o plano se aplica. */
  maxPain?: number
  active: boolean
  createdAt: string
  updatedAt: string
}
