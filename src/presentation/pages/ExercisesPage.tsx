import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { AnatomicalStructure } from '@/domain/anatomical-structures'
import type { AnatomicalMapPlacement } from '@/domain/common/types'
import { isValidYoutubeUrl } from '@/domain/exercises'
import type { CreateExerciseInput, Exercise, ExerciseKind } from '@/domain/exercises'
import type { ExerciseTarget } from '@/domain/exercises'
import { BodyPainMap } from '@/presentation/components/BodyPainMap'
import { anatomicalStructureRepository } from '@/infrastructure/repositories/anatomical-structures/InMemoryAnatomicalStructureRepository'
import { exerciseRepository } from '@/infrastructure/repositories/exercises/InMemoryExerciseRepository'

const pageSize = 5
const emptyForm: CreateExerciseInput = { anatomicalStructureId: '', targets: [], kind: 'therapeutic', name: '', slug: '', description: '', instructions: '', youtubeUrl: '', active: true }

export function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [structures, setStructures] = useState<AnatomicalStructure[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [structureFilter, setStructureFilter] = useState('')
  const [kindFilter, setKindFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const active = activeFilter === 'all' ? undefined : activeFilter === 'active'
      const result = await exerciseRepository.list({ search, active, anatomicalStructureId: structureFilter || undefined, kind: kindFilter === 'all' ? undefined : kindFilter as ExerciseKind, page, pageSize })
      setExercises(result.items); setTotal(result.total)
    } catch { setError('Não foi possível carregar os exercícios.') }
    finally { setLoading(false) }
  }, [activeFilter, kindFilter, page, search, structureFilter])

  useEffect(() => {
    anatomicalStructureRepository.list({ pageSize: 100 })
      .then(({ items }) => { setStructures(items) })
      .catch(() => setError('Não foi possível carregar as opções de relacionamento.'))
  }, [])
  useEffect(() => { void load() }, [load])

  const resetForm = () => { setEditingId(null); setForm({ ...emptyForm, anatomicalStructureId: structures[0]?.id ?? '' }) }
  const edit = (exercise: Exercise) => {
    setEditingId(exercise.id)
    setForm({ anatomicalStructureId: exercise.anatomicalStructureId, targets: exercise.targets ?? [{ anatomicalStructureId: exercise.anatomicalStructureId, allPlacements: true }], kind: exercise.kind, name: exercise.name, slug: exercise.slug, description: exercise.description, instructions: exercise.instructions, youtubeUrl: exercise.youtubeUrl ?? '', active: exercise.active })
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null)
    if (form.youtubeUrl && !isValidYoutubeUrl(form.youtubeUrl)) {
      setError('Informe uma URL válida do YouTube (youtube.com ou youtu.be).')
      return
    }
    if (form.targets.length === 0) {
      setError('Selecione pelo menos uma posição ou estrutura anatômica.')
      return
    }
    setSaving(true)
    try {
      const input = { ...form, anatomicalStructureId: form.targets[0].anatomicalStructureId }
      if (editingId) await exerciseRepository.update(editingId, input)
      else await exerciseRepository.create(input)
      resetForm(); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o exercício.') }
    finally { setSaving(false) }
  }
  async function remove(exercise: Exercise) {
    if (!window.confirm(`Excluir o exercício "${exercise.name}"?`)) return
    setDeletingId(exercise.id); setError(null)
    try { await exerciseRepository.delete(exercise.id); if (exercises.length === 1 && page > 1) setPage((current) => current - 1); else await load() }
    catch { setError('Não foi possível excluir o exercício.') }
    finally { setDeletingId(null) }
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const structureName = (id: string) => structures.find((structure) => structure.id === id)?.name ?? 'Estrutura não encontrada'

  return <>
    <div className="page-heading"><div><p className="eyebrow">Cadastros</p><h1>Exercícios</h1><p className="muted">Gerencie exercícios relacionados às estruturas anatômicas.</p></div><button type="button" onClick={resetForm}>Novo exercício</button></div>
    {error && <div className="alert" role="alert">{error}</div>}
    <section className="card form-card" aria-label="Formulário de exercício"><h2>{editingId ? 'Editar exercício' : 'Novo exercício'}</h2><form onSubmit={submit} className="region-form">
      <label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>Slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
      <div className="wide"><p className="muted">Clique nos markers para selecionar ou remover posições. Os selecionados ficam azuis.</p><BodyPainMap regions={[]} selectedRegionId="" structureOptions={structures.map((structure) => ({ id: structure.id, label: structure.name, placements: structure.mapPlacements }))} selectedStructureId={form.targets[0]?.anatomicalStructureId} selectedPlacement={form.targets[0]?.placement} isStructureSelected={(structureId, placement) => { const selected = form.targets.some((item) => item.anatomicalStructureId === structureId && item.placement?.face === placement.face && item.placement?.side === placement.side); console.debug('[Exercises] estado visual do marker', { structureId, placement, selected }); return selected }} onSelect={() => undefined} onSelectStructure={(structureId, placement) => { const exists = form.targets.some((item) => item.anatomicalStructureId === structureId && item.placement?.face === placement.face && item.placement?.side === placement.side); const targets = exists ? form.targets.filter((item) => !(item.anatomicalStructureId === structureId && item.placement?.face === placement.face && item.placement?.side === placement.side)) : [...form.targets, { anatomicalStructureId: structureId, placement }]; console.info('[Exercises] alternando target', { structureId, placement, exists, targets }); setForm({ ...form, anatomicalStructureId: structureId, targets }) }} /></div>
      <fieldset className="toggle-field"><legend>Tipo</legend><div className="toggle-group" role="group" aria-label="Tipo de exercício"><button className={form.kind === 'therapeutic' ? 'toggle-option selected' : 'toggle-option'} type="button" aria-pressed={form.kind === 'therapeutic'} onClick={() => setForm({ ...form, kind: 'therapeutic' })}>Terapêutico</button><button className={form.kind === 'evaluation' ? 'toggle-option selected' : 'toggle-option'} type="button" aria-pressed={form.kind === 'evaluation'} onClick={() => setForm({ ...form, kind: 'evaluation' })}>Avaliativo</button></div></fieldset>
      <label className="wide">Descrição<textarea required rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <label className="wide">Instruções<textarea required rows={3} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} /></label>
      <label className="wide">Vídeo do YouTube (opcional)<input type="url" placeholder="https://www.youtube.com/watch?v=..." value={form.youtubeUrl} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })} /></label>
      <label className="checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Ativo</label>
      <div className="form-actions"><button type="submit" disabled={saving || form.targets.length === 0}>{saving ? 'Salvando...' : 'Salvar'}</button>{editingId && <button type="button" className="secondary" onClick={resetForm}>Cancelar</button>}</div>
    </form></section>
    <section className="card" aria-label="Lista de exercícios"><div className="filters">
      <label>Buscar<input placeholder="Nome ou slug" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label>
      <label>Estrutura<select value={structureFilter} onChange={(event) => { setStructureFilter(event.target.value); setPage(1) }}><option value="">Todas</option>{structures.map((structure) => <option key={structure.id} value={structure.id}>{structure.name}</option>)}</select></label>
      <label>Status<select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1) }}><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></label>
      <label>Tipo<select value={kindFilter} onChange={(event) => { setKindFilter(event.target.value); setPage(1) }}><option value="all">Todos</option><option value="therapeutic">Terapêuticos</option><option value="evaluation">Avaliativos</option></select></label>
    </div>
    {loading ? <p className="muted">Carregando...</p> : exercises.length === 0 ? <p className="muted empty-state">Nenhum exercício encontrado.</p> : <><div className="table-wrap"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Estrutura</th><th>Vídeo</th><th>Status</th><th>Ações</th></tr></thead><tbody>{exercises.map((exercise) => <tr key={exercise.id}><td><strong>{exercise.name}</strong><br /><span className="muted">{exercise.description}</span></td><td>{exercise.kind === 'evaluation' ? 'Avaliativo' : 'Terapêutico'}</td><td>{structureName(exercise.anatomicalStructureId)}</td><td>{exercise.youtubeUrl ? <a href={exercise.youtubeUrl} target="_blank" rel="noreferrer">Assistir vídeo</a> : <span className="muted">—</span>}</td><td><span className={exercise.active ? 'status status-active' : 'status'}>{exercise.active ? 'Ativo' : 'Inativo'}</span></td><td><div className="row-actions"><button className="link-button" type="button" onClick={() => edit(exercise)}>Editar</button><button className="link-button danger" type="button" disabled={deletingId === exercise.id} onClick={() => void remove(exercise)}>{deletingId === exercise.id ? 'Excluindo...' : 'Excluir'}</button></div></td></tr>)}</tbody></table></div><div className="pagination"><span className="muted">{total} resultado(s)</span><div><button className="secondary" type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span> Página {page} de {totalPages} </span><button className="secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</button></div></div></>}
    </section>
  </>
}
