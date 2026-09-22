export type EntityId = string

export interface MapPosition {
  left: string
  top: string
}

export type MapFace = 'anterior' | 'posterior'
export type MapSide = 'left' | 'right'

export interface AnatomicalMapPlacement extends MapPosition {
  face: MapFace
  side: MapSide
}

export interface Pagination {
  page: number
  pageSize: number
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  pagination: Pagination
}
