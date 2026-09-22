import type {
  CreateExerciseInput,
  Exercise,
  ExerciseListFilters,
  ExerciseRepository,
  UpdateExerciseInput,
} from '@/domain/exercises'
import type { PaginatedResult } from '@/domain/common/types'
import { exercisesMock } from './exercises.mock'
import { isValidYoutubeUrl } from '@/domain/exercises'

const storageKey = 'anatomia-admin:exercises'

export class InMemoryExerciseRepository implements ExerciseRepository {
  private readonly exercises: Exercise[]

  constructor(initialData: Exercise[] = exercisesMock) {
    this.exercises = this.load(initialData)
  }

  private load(initialData: Exercise[]) {
    if (typeof window === 'undefined') return [...initialData]
    const stored = window.localStorage.getItem(storageKey)
    if (!stored) return [...initialData]
    try {
      const parsed: unknown = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed as Exercise[] : [...initialData]
    } catch {
      return [...initialData]
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, JSON.stringify(this.exercises))
    }
  }

  async list(filters: ExerciseListFilters = {}): Promise<PaginatedResult<Exercise>> {
    const search = filters.search?.trim().toLocaleLowerCase()
    const filtered = this.exercises.filter((exercise) => {
      const matchesSearch = !search ||
        exercise.name.toLocaleLowerCase().includes(search) ||
        exercise.slug.toLocaleLowerCase().includes(search)
      return matchesSearch &&
        (filters.active === undefined || exercise.active === filters.active) &&
        (!filters.anatomicalStructureId || exercise.anatomicalStructureId === filters.anatomicalStructureId) &&
        (!filters.kind || exercise.kind === filters.kind)
    })
    const pageSize = Math.max(1, filters.pageSize ?? filtered.length, 1)
    const page = Math.max(1, filters.page ?? 1)
    const start = (page - 1) * pageSize
    return { items: filtered.slice(start, start + pageSize), total: filtered.length, pagination: { page, pageSize } }
  }

  async create(input: CreateExerciseInput) {
    if (input.youtubeUrl && !isValidYoutubeUrl(input.youtubeUrl)) {
      throw new Error('O link informado não é uma URL válida do YouTube.')
    }
    if (this.exercises.some((exercise) => exercise.slug === input.slug)) {
      throw new Error('Já existe um exercício com este slug.')
    }
    const now = new Date().toISOString()
    const exercise: Exercise = { ...input, id: `${input.slug}-${Date.now()}`, createdAt: now, updatedAt: now }
    this.exercises.push(exercise)
    this.persist()
    return exercise
  }

  async update(id: string, input: UpdateExerciseInput) {
    const index = this.exercises.findIndex((exercise) => exercise.id === id)
    if (index === -1) throw new Error('Exercício não encontrado.')
    if (input.youtubeUrl && !isValidYoutubeUrl(input.youtubeUrl)) {
      throw new Error('O link informado não é uma URL válida do YouTube.')
    }
    if (this.exercises.some((exercise, exerciseIndex) => exerciseIndex !== index && exercise.slug === input.slug)) {
      throw new Error('Já existe um exercício com este slug.')
    }
    const updated = { ...this.exercises[index], ...input, updatedAt: new Date().toISOString() }
    this.exercises[index] = updated
    this.persist()
    return updated
  }

  async delete(id: string) {
    const index = this.exercises.findIndex((exercise) => exercise.id === id)
    if (index === -1) throw new Error('Exercício não encontrado.')
    this.exercises.splice(index, 1)
    this.persist()
  }
}

export const exerciseRepository = new InMemoryExerciseRepository()
