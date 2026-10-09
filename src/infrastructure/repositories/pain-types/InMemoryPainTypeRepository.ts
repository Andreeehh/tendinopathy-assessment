import type {
  CreatePainTypeInput,
  PainType,
  PainTypeListFilters,
  PainTypeRepository,
  UpdatePainTypeInput,
} from '@/domain/pain-types'
import type { PaginatedResult } from '@/domain/common/types'
import { painTypesMock, painTypesSeedVersion } from './painTypes.mock'
import { loadSeeded } from '../seedStorage'

const storageKey = 'anatomia-admin:pain-types'

export class InMemoryPainTypeRepository implements PainTypeRepository {
  private readonly painTypes: PainType[]

  constructor(initialData: PainType[] = painTypesMock) {
    this.painTypes = this.load(initialData)
  }

  private load(initialData: PainType[]) {
    return loadSeeded({ storageKey, seed: initialData, version: painTypesSeedVersion })
  }

  private persist() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(this.painTypes))
    }
  }

  async list(filters: PainTypeListFilters = {}): Promise<PaginatedResult<PainType>> {
    const search = filters.search?.trim().toLocaleLowerCase()
    const filtered = this.painTypes.filter((painType) => {
      const matchesSearch = !search ||
        painType.name.toLocaleLowerCase().includes(search) ||
        painType.slug.toLocaleLowerCase().includes(search)
      return matchesSearch && (filters.active === undefined || painType.active === filters.active)
    })
    const pageSize = Math.max(1, filters.pageSize ?? filtered.length, 1)
    const page = Math.max(1, filters.page ?? 1)
    const start = (page - 1) * pageSize
    return { items: filtered.slice(start, start + pageSize), total: filtered.length, pagination: { page, pageSize } }
  }

  async create(input: CreatePainTypeInput) {
    if (this.painTypes.some((painType) => painType.slug === input.slug)) {
      throw new Error('Já existe um tipo de dor com este slug.')
    }
    const now = new Date().toISOString()
    const painType: PainType = { ...input, id: `${input.slug}-${Date.now()}`, createdAt: now, updatedAt: now }
    this.painTypes.push(painType)
    this.persist()
    return painType
  }

  async update(id: string, input: UpdatePainTypeInput) {
    const index = this.painTypes.findIndex((painType) => painType.id === id)
    if (index === -1) throw new Error('Tipo de dor não encontrado.')
    if (this.painTypes.some((painType, painTypeIndex) => painTypeIndex !== index && painType.slug === input.slug)) {
      throw new Error('Já existe um tipo de dor com este slug.')
    }
    const updated = { ...this.painTypes[index], ...input, updatedAt: new Date().toISOString() }
    this.painTypes[index] = updated
    this.persist()
    return updated
  }

  async delete(id: string) {
    const index = this.painTypes.findIndex((painType) => painType.id === id)
    if (index === -1) throw new Error('Tipo de dor não encontrado.')
    this.painTypes.splice(index, 1)
    this.persist()
  }
}

export const painTypeRepository = new InMemoryPainTypeRepository()
