import type { PaginatedResult } from '@/domain/common/types'
import type { Exercise, ExerciseKind, ExerciseTarget } from './Exercise'

export interface ExerciseListFilters {
  /** @deprecated Compatibility filter for legacy records. */
  bodyRegionId?: string
  search?: string
  active?: boolean
  anatomicalStructureId?: string
  kind?: ExerciseKind
  page?: number
  pageSize?: number
}

export interface CreateExerciseInput {
  /** @deprecated Compatibility field while legacy forms are migrated. */
  bodyRegionId?: string
  anatomicalStructureId: string
  targets: ExerciseTarget[]
  kind: ExerciseKind
  name: string
  slug: string
  description: string
  instructions: string
  youtubeUrl?: string
  active: boolean
}

export type UpdateExerciseInput = CreateExerciseInput

export interface ExerciseRepository {
  list(filters?: ExerciseListFilters): Promise<PaginatedResult<Exercise>>
  create(input: CreateExerciseInput): Promise<Exercise>
  update(id: string, input: UpdateExerciseInput): Promise<Exercise>
  delete(id: string): Promise<void>
}
