import type { AnatomicalMapPlacement, MapPosition, PaginatedResult } from '@/domain/common/types'
import type { AnatomicalStructure } from './AnatomicalStructure'

export interface AnatomicalStructureListFilters {
  /** @deprecated Compatibility filter for legacy records. */
  bodyRegionId?: string
  search?: string
  active?: boolean
  page?: number
  pageSize?: number
}

export interface CreateAnatomicalStructureInput {
  /** @deprecated Compatibility field while legacy forms are migrated. */
  bodyRegionId?: string
  name: string
  slug: string
  description: string
  mapPosition?: MapPosition
  mapPlacements?: AnatomicalMapPlacement[]
  active: boolean
}

export type UpdateAnatomicalStructureInput = CreateAnatomicalStructureInput

export interface AnatomicalStructureRepository {
  list(filters?: AnatomicalStructureListFilters): Promise<PaginatedResult<AnatomicalStructure>>
  create(input: CreateAnatomicalStructureInput): Promise<AnatomicalStructure>
  update(id: string, input: UpdateAnatomicalStructureInput): Promise<AnatomicalStructure>
  delete(id: string): Promise<void>
}
