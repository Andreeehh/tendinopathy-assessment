import type { EntityId } from '@/domain/common/types'
import type { AnatomicalMapPlacement } from '@/domain/common/types'
import type { PhaseStimulus, TreatmentPhase } from '@/domain/treatment/types'

export type ExerciseKind = 'evaluation' | 'therapeutic'

export interface ExerciseTarget {
  anatomicalStructureId: EntityId
  placement?: AnatomicalMapPlacement
  allPlacements?: boolean
}

/** Parâmetros de prescrição cadastrados a partir do conteúdo do educador físico. */
export interface ExercisePrescription {
  phase?: TreatmentPhase
  stimulus?: PhaseStimulus
  sets?: number
  reps?: number
  durationSeconds?: number
  cadence?: string
  restSeconds?: number
  /** Esforço-alvo de 0 a 10 (padrão do projeto: 7). */
  targetEffort?: number
  /** Dor máxima tolerada durante o exercício (padrão do projeto: 4). */
  painLimit?: number
  equipment?: string
  commonErrors?: string
  nextDayGuidance?: string
  progressionExerciseId?: EntityId
  regressionExerciseId?: EntityId
  /** Tipos de dor que o usuário poderá indicar ao executar este exercício. */
  painTypeIds?: EntityId[]
  allowOtherPainDescription?: boolean
}

export interface Exercise extends ExercisePrescription {
  id: EntityId
  kind: ExerciseKind
  /** @deprecated Compatibility field while legacy exercise records are migrated. */
  bodyRegionId?: EntityId
  anatomicalStructureId: EntityId
  targets?: ExerciseTarget[]
  name: string
  slug: string
  description: string
  instructions: string
  youtubeUrl?: string
  active: boolean
  createdAt: string
  updatedAt: string
}
