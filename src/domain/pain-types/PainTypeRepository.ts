import type { PaginatedResult } from '@/domain/common/types'
import type { PainType } from './PainType'

export interface PainTypeListFilters {
  search?: string
  active?: boolean
  page?: number
  pageSize?: number
}

export interface CreatePainTypeInput {
  name: string
  slug: string
  description: string
  isAlertSign: boolean
  active: boolean
}

export type UpdatePainTypeInput = CreatePainTypeInput

export interface PainTypeRepository {
  list(filters?: PainTypeListFilters): Promise<PaginatedResult<PainType>>
  create(input: CreatePainTypeInput): Promise<PainType>
  update(id: string, input: UpdatePainTypeInput): Promise<PainType>
  delete(id: string): Promise<void>
}
