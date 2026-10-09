import type {
  CreateExerciseGroupInput,
  ExerciseGroup,
  ExerciseGroupListFilters,
  ExerciseGroupRepository,
  UpdateExerciseGroupInput,
} from '@/domain/exercise-groups'
import type { PaginatedResult } from '@/domain/common/types'
import { exerciseGroupsMock, exerciseGroupsSeedVersion, legacyExerciseGroupIds } from './exerciseGroups.mock'
import { loadSeeded } from '../seedStorage'

const storageKey = 'anatomia-admin:exercise-groups'

function validate(input: CreateExerciseGroupInput) {
  if (input.exerciseIds.length === 0) {
    throw new Error('Selecione pelo menos um exercício para o grupo.')
  }
  if (input.kind === 'plan') {
    const min = input.minPain ?? 0
    const max = input.maxPain ?? 10
    if (min < 0 || max > 10 || min > max) {
      throw new Error('A faixa de dor deve estar entre 0 e 10, com mínimo menor ou igual ao máximo.')
    }
  }
}

export class InMemoryExerciseGroupRepository implements ExerciseGroupRepository {
  private readonly groups: ExerciseGroup[]

  constructor(initialData: ExerciseGroup[] = exerciseGroupsMock) {
    this.groups = this.load(initialData)
  }

  private load(initialData: ExerciseGroup[]) {
    return loadSeeded({
      storageKey,
      seed: initialData,
      version: exerciseGroupsSeedVersion,
      legacyIds: legacyExerciseGroupIds,
    })
  }

  private persist() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(this.groups))
    }
  }

  async list(filters: ExerciseGroupListFilters = {}): Promise<PaginatedResult<ExerciseGroup>> {
    const search = filters.search?.trim().toLocaleLowerCase()
    const filtered = this.groups.filter((group) => {
      const matchesSearch = !search ||
        group.name.toLocaleLowerCase().includes(search) ||
        group.slug.toLocaleLowerCase().includes(search)
      return matchesSearch &&
        (!filters.kind || group.kind === filters.kind) &&
        (filters.active === undefined || group.active === filters.active) &&
        (!filters.anatomicalStructureId || group.anatomicalStructureId === filters.anatomicalStructureId)
    })
    const pageSize = Math.max(1, filters.pageSize ?? filtered.length, 1)
    const page = Math.max(1, filters.page ?? 1)
    const start = (page - 1) * pageSize
    return { items: filtered.slice(start, start + pageSize), total: filtered.length, pagination: { page, pageSize } }
  }

  async create(input: CreateExerciseGroupInput) {
    validate(input)
    if (this.groups.some((group) => group.slug === input.slug)) {
      throw new Error('Já existe um grupo com este slug.')
    }
    const now = new Date().toISOString()
    const group: ExerciseGroup = { ...input, id: `${input.slug}-${Date.now()}`, createdAt: now, updatedAt: now }
    this.groups.push(group)
    this.persist()
    return group
  }

  async update(id: string, input: UpdateExerciseGroupInput) {
    const index = this.groups.findIndex((group) => group.id === id)
    if (index === -1) throw new Error('Grupo de exercícios não encontrado.')
    validate(input)
    if (this.groups.some((group, groupIndex) => groupIndex !== index && group.slug === input.slug)) {
      throw new Error('Já existe um grupo com este slug.')
    }
    const updated = { ...this.groups[index], ...input, updatedAt: new Date().toISOString() }
    this.groups[index] = updated
    this.persist()
    return updated
  }

  async delete(id: string) {
    const index = this.groups.findIndex((group) => group.id === id)
    if (index === -1) throw new Error('Grupo de exercícios não encontrado.')
    this.groups.splice(index, 1)
    this.persist()
  }
}

export const exerciseGroupRepository = new InMemoryExerciseGroupRepository()
