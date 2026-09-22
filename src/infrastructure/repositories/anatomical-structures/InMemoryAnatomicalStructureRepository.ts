import type {
  AnatomicalStructure,
  AnatomicalStructureListFilters,
  AnatomicalStructureRepository,
  CreateAnatomicalStructureInput,
  UpdateAnatomicalStructureInput,
} from '@/domain/anatomical-structures'
import type { PaginatedResult } from '@/domain/common/types'
import { anatomicalStructuresMock } from './anatomicalStructures.mock'

const storageKey = 'anatomia-admin:anatomical-structures'

export class InMemoryAnatomicalStructureRepository implements AnatomicalStructureRepository {
  private readonly structures: AnatomicalStructure[]

  constructor(initialData: AnatomicalStructure[] = anatomicalStructuresMock) {
    this.structures = this.load(initialData)
  }

  private load(initialData: AnatomicalStructure[]) {
    if (typeof window === 'undefined') return [...initialData]
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return [...initialData]
    try {
      const parsed: unknown = JSON.parse(stored)
      if (!Array.isArray(parsed)) return [...initialData]
      return parsed as AnatomicalStructure[]
    } catch {
      return [...initialData]
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(this.structures))
    }
  }

  async list(filters: AnatomicalStructureListFilters = {}): Promise<PaginatedResult<AnatomicalStructure>> {
    const search = filters.search?.trim().toLocaleLowerCase()
    const filtered = this.structures.filter((structure) => {
      const matchesSearch = !search ||
        structure.name.toLocaleLowerCase().includes(search) ||
        structure.slug.toLocaleLowerCase().includes(search)
      return matchesSearch &&
        (filters.active === undefined || structure.active === filters.active) &&
        true
    })
    const pageSize = Math.max(1, filters.pageSize ?? filtered.length, 1)
    const page = Math.max(1, filters.page ?? 1)
    const start = (page - 1) * pageSize
    return { items: filtered.slice(start, start + pageSize), total: filtered.length, pagination: { page, pageSize } }
  }

  async create(input: CreateAnatomicalStructureInput) {
    if (this.structures.some((structure) => structure.slug === input.slug)) {
      throw new Error('Já existe uma estrutura com este slug.')
    }
    const now = new Date().toISOString()
    const structure: AnatomicalStructure = { ...input, id: `${input.slug}-${Date.now()}`, createdAt: now, updatedAt: now }
    this.structures.push(structure)
    this.persist()
    return structure
  }

  async update(id: string, input: UpdateAnatomicalStructureInput) {
    const index = this.structures.findIndex((structure) => structure.id === id)
    if (index === -1) throw new Error('Estrutura anatômica não encontrada.')
    if (this.structures.some((structure, structureIndex) => structureIndex !== index && structure.slug === input.slug)) {
      throw new Error('Já existe uma estrutura com este slug.')
    }
    const updated = { ...this.structures[index], ...input, updatedAt: new Date().toISOString() }
    this.structures[index] = updated
    this.persist()
    return updated
  }

  async delete(id: string) {
    const index = this.structures.findIndex((structure) => structure.id === id)
    if (index === -1) throw new Error('Estrutura anatômica não encontrada.')
    this.structures.splice(index, 1)
    this.persist()
  }
}

export const anatomicalStructureRepository = new InMemoryAnatomicalStructureRepository()
