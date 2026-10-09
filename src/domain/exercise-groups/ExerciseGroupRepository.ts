import type { PaginatedResult } from '@/domain/common/types'
import type { ExerciseGroup, ExerciseGroupKind } from './ExerciseGroup'

export interface ExerciseGroupListFilters {
  search?: string
  kind?: ExerciseGroupKind
  active?: boolean
  anatomicalStructureId?: string
  page?: number
  pageSize?: number
}

export interface CreateExerciseGroupInput {
  kind: ExerciseGroupKind
  name: string
  slug: string
  description: string
  anatomicalStructureId: string
  exerciseIds: string[]
  minPain?: number
  maxPain?: number
  active: boolean
}

export type UpdateExerciseGroupInput = CreateExerciseGroupInput

export interface ExerciseGroupRepository {
  list(filters?: ExerciseGroupListFilters): Promise<PaginatedResult<ExerciseGroup>>
  create(input: CreateExerciseGroupInput): Promise<ExerciseGroup>
  update(id: string, input: UpdateExerciseGroupInput): Promise<ExerciseGroup>
  delete(id: string): Promise<void>
}
