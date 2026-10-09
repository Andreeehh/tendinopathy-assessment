import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { AnatomicalStructure } from '@/domain/anatomical-structures'
import type { CreateExerciseGroupInput, ExerciseGroup, ExerciseGroupKind } from '@/domain/exercise-groups'
import type { Exercise } from '@/domain/exercises'
import { exerciseMatchesStructure } from '@/domain/exercises'
import { anatomicalStructureRepository } from '@/infrastructure/repositories/anatomical-structures/InMemoryAnatomicalStructureRepository'
import { exerciseGroupRepository } from '@/infrastructure/repositories/exercise-groups/InMemoryExerciseGroupRepository'
import { exerciseRepository } from '@/infrastructure/repositories/exercises/InMemoryExerciseRepository'

const pageSize = 8

interface ExerciseGroupsPageProps {
  kind: ExerciseGroupKind
}

const copy = {
  evaluation: {
    title: 'Grupos avaliativos',
    newLabel: 'Novo grupo avaliativo',
    formTitle: ['Novo grupo avaliativo', 'Editar grupo avaliativo'],
    exerciseKind: 'evaluation' as const,
    exerciseLegend: 'Exercícios avaliativos da bateria (ordem de execução)',
    hint: 'O usuário executa todos os exercícios do grupo; a maior dor registrada direciona o plano.',
  },
  plan: {
    title: 'Planos terapêuticos',
    newLabel: 'Novo plano',
    formTitle: ['Novo plano', 'Editar plano'],
    exerciseKind: 'therapeutic' as const,
    exerciseLegend: 'Exercícios terapêuticos do plano (ordem de execução)',
    hint: 'O plano é indicado quando a maior dor da bateria avaliativa cai na faixa abaixo.',
  },
}

function toNumber(value: string): number | undefined {
  if (value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function ExerciseGroupsPage({ kind }: ExerciseGroupsPageProps) {
  const text = copy[kind]
  const emptyForm: CreateExerciseGroupInput = { kind, name: '', slug: '', description: '', anatomicalStructureId: '', exerciseIds: [], active: true }

  const [groups, setGroups] = useState<ExerciseGroup[]>([])
  const [structures, setStructures] = useState<AnatomicalStructure[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [screen, setScreen] = useState<'list' | 'form'>('list')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const result = await exerciseGroupRepository.list({ kind, search, page, pageSize })
      setGroups(result.items); setTotal(result.total)
    } catch { setError('Não foi possível carregar os grupos.') }
    finally { setLoading(false) }
  }, [kind, page, search])

  useEffect(() => {
    Promise.all([anatomicalStructureRepository.list({ pageSize: 100 }), exerciseRepository.list({ pageSize: 500 })])
      .then(([structureResult, exerciseResult]) => { setStructures(structureResult.items); setExercises(exerciseResult.items) })
      .catch(() => setError('Não foi possível carregar estruturas e exercícios.'))
  }, [])
  useEffect(() => { setScreen('list'); setPage(1); setSearch('') }, [kind])
  useEffect(() => { void load() }, [load])

  const availableExercises = exercises.filter((exercise) =>
    exercise.kind === text.exerciseKind &&
    exercise.active &&
    form.anatomicalStructureId !== '' &&
    exerciseMatchesStructure(exercise, form.anatomicalStructureId),
  )
  const structureName = (id: string) => structures.find((structure) => structure.id === id)?.name ?? 'Estrutura não encontrada'
  const exerciseName = (id: string) => exercises.find((exercise) => exercise.id === id)?.name ?? 'Exercício removido'

  function startCreate() {
    setEditingId(null)
    setForm({ ...emptyForm, anatomicalStructureId: structures[0]?.id ?? '' })
    setScreen('form')
  }

  function startEdit(group: ExerciseGroup) {
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = group
    setEditingId(group.id)
    setForm(rest)
    setScreen('form')
  }

  function toggleExercise(exerciseId: string) {
    const selected = form.exerciseIds.includes(exerciseId)
    setForm({ ...form, exerciseIds: selected ? form.exerciseIds.filter((id) => id !== exerciseId) : [...form.exerciseIds, exerciseId] })
  }

  function changeStructure(structureId: string) {
    setForm({ ...form, anatomicalStructureId: structureId, exerciseIds: [] })
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null)
    try {
      if (editingId) await exerciseGroupRepository.update(editingId, form)
      else await exerciseGroupRepository.create(form)
      setScreen('list'); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o grupo.') }
    finally { setSaving(false) }
  }

  async function remove(group: ExerciseGroup) {
    if (!window.confirm(`Excluir "${group.name}"?`)) return
    setDeletingId(group.id); setError(null)
    try {
      await exerciseGroupRepository.delete(group.id)
      if (groups.length === 1 && page > 1) setPage((current) => current - 1)
      else await load()
    } catch { setError('Não foi possível excluir o grupo.') }
    finally { setDeletingId(null) }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return <>
    {error && <div className="alert" role="alert">{error}</div>}
    <section className={screen === 'form' ? 'card form-card' : 'hidden'} aria-label={text.formTitle[0]}>
      <h2>{editingId ? text.formTitle[1] : text.formTitle[0]}</h2>
      <form onSubmit={submit} className="region-form">
        <label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
        <label>Estrutura anatômica<select required value={form.anatomicalStructureId} onChange={(event) => changeStructure(event.target.value)}><option value="">Selecione</option>{structures.map((structure) => <option key={structure.id} value={structure.id}>{structure.name}</option>)}</select></label>
        {kind === 'plan' && <div className="range-fields"><label>Dor máxima da bateria — de<input type="number" min={0} max={10} placeholder="0" value={form.minPain ?? ''} onChange={(event) => setForm({ ...form, minPain: toNumber(event.target.value) })} /></label><label>até<input type="number" min={0} max={10} placeholder="10" value={form.maxPain ?? ''} onChange={(event) => setForm({ ...form, maxPain: toNumber(event.target.value) })} /></label></div>}
        <label className="wide">Descrição<textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <fieldset className="wide toggle-field">
          <legend>{text.exerciseLegend}</legend>
          <p className="muted group-hint">{text.hint}</p>
          <div className="chip-group">
            {availableExercises.map((exercise) => {
              const position = form.exerciseIds.indexOf(exercise.id)
              const selected = position >= 0
              return <button key={exercise.id} type="button" className={selected ? 'chip selected' : 'chip'} aria-pressed={selected} onClick={() => toggleExercise(exercise.id)}>{selected ? `${position + 1}. ` : ''}{exercise.name}</button>
            })}
            {form.anatomicalStructureId === '' && <span className="muted">Selecione uma estrutura para listar os exercícios.</span>}
            {form.anatomicalStructureId !== '' && availableExercises.length === 0 && <span className="muted">Nenhum exercício {kind === 'plan' ? 'terapêutico' : 'avaliativo'} ativo para esta estrutura.</span>}
          </div>
        </fieldset>
        <label className="checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Ativo</label>
        <div className="form-actions wide"><button type="submit" disabled={saving || form.exerciseIds.length === 0}>{saving ? 'Salvando...' : 'Salvar'}</button><button type="button" className="secondary" onClick={() => setScreen('list')}>Cancelar</button></div>
      </form>
    </section>
    <section className={screen === 'list' ? 'card' : 'hidden'} aria-label={text.title}>
      <div className="list-toolbar"><h1>{text.title}</h1><button type="button" onClick={startCreate}>{text.newLabel}</button></div>
      <div className="filters"><label>Buscar<input placeholder="Nome ou slug" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label></div>
      {loading ? <p className="muted">Carregando...</p> : groups.length === 0 ? <p className="muted empty-state">Nenhum registro encontrado.</p> : <>
        <div className="table-wrap"><table><thead><tr><th>Nome</th><th>Estrutura</th>{kind === 'plan' && <th>Faixa de dor</th>}<th>Exercícios</th><th>Status</th><th>Ações</th></tr></thead><tbody>{groups.map((group) => <tr key={group.id}><td><strong>{group.name}</strong><br /><span className="muted">{group.description}</span></td><td>{structureName(group.anatomicalStructureId)}</td>{kind === 'plan' && <td>{group.minPain ?? 0} a {group.maxPain ?? 10}</td>}<td>{group.exerciseIds.map((id, index) => <div key={id}>{index + 1}. {exerciseName(id)}</div>)}</td><td><span className={group.active ? 'status status-active' : 'status'}>{group.active ? 'Ativo' : 'Inativo'}</span></td><td><div className="row-actions"><button className="link-button" type="button" onClick={() => startEdit(group)}>Editar</button><button className="link-button danger" type="button" disabled={deletingId === group.id} onClick={() => void remove(group)}>{deletingId === group.id ? 'Excluindo...' : 'Excluir'}</button></div></td></tr>)}</tbody></table></div>
        <div className="pagination"><span className="muted">{total} resultado(s)</span><div><button className="secondary" type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span> Página {page} de {totalPages} </span><button className="secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</button></div></div>
      </>}
    </section>
  </>
}
