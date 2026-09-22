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

export class InMemoryExerciseRepository implements ExerciseRepository {
  private readonly exercises: Exercise[]

  constructor(initialData: Exercise[] = exercisesMock) {
    this.exercises = [...initialData]
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
    return updated
  }

  async delete(id: string) {
    const index = this.exercises.findIndex((exercise) => exercise.id === id)
    if (index === -1) throw new Error('Exercício não encontrado.')
    this.exercises.splice(index, 1)
  }
}

export const exerciseRepository = new InMemoryExerciseRepository()
