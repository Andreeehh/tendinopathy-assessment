import type { EntityId } from '@/domain/common/types'
import type { AnatomicalMapPlacement } from '@/domain/common/types'

export type ExerciseKind = 'evaluation' | 'therapeutic'

export interface ExerciseTarget {
  anatomicalStructureId: EntityId
  placement?: AnatomicalMapPlacement
  allPlacements?: boolean
}

export interface Exercise {
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
