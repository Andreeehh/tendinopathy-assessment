import type { AnatomicalMapPlacement, EntityId, MapPosition } from '@/domain/common/types'

export interface AnatomicalStructure {
  id: EntityId
  /** @deprecated Compatibility field while legacy admin data is migrated. */
  bodyRegionId?: EntityId
  name: string
  slug: string
  description: string
  mapPosition?: MapPosition
  mapPlacements?: AnatomicalMapPlacement[]
  active: boolean
  createdAt: string
  updatedAt: string
}
