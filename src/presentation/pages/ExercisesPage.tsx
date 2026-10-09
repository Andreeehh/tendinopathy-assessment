import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { AnatomicalStructure } from '@/domain/anatomical-structures'
import type { AnatomicalMapPlacement } from '@/domain/common/types'
import { isValidYoutubeUrl } from '@/domain/exercises'
import type { CreateExerciseInput, Exercise, ExerciseKind } from '@/domain/exercises'
import type { ExerciseTarget } from '@/domain/exercises'
import type { PainType } from '@/domain/pain-types'
import { phaseLabels, stimulusLabels } from '@/domain/treatment'
import type { PhaseStimulus, TreatmentPhase } from '@/domain/treatment'
import { BodyPainMap } from '@/presentation/components/BodyPainMap'
import { FormWizardActions } from '@/presentation/components/FormWizardActions'
import { anatomicalStructureRepository } from '@/infrastructure/repositories/anatomical-structures/InMemoryAnatomicalStructureRepository'
import { exerciseRepository } from '@/infrastructure/repositories/exercises/InMemoryExerciseRepository'
import { painTypeRepository } from '@/infrastructure/repositories/pain-types/InMemoryPainTypeRepository'

const pageSize = 5
const emptyForm: CreateExerciseInput = { anatomicalStructureId: '', targets: [], kind: 'therapeutic', name: '', slug: '', description: '', instructions: '', youtubeUrl: '', active: true, painTypeIds: [], allowOtherPainDescription: true }

function toNumber(value: string): number | undefined {
  if (value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [allExercises, setAllExercises] = useState<Exercise[]>([])
  const [painTypes, setPainTypes] = useState<PainType[]>([])
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
  const [screen, setScreen] = useState<'list' | 'form'>('list')
  const [formTab, setFormTab] = useState<'data' | 'prescription' | 'map'>('data')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const active = activeFilter === 'all' ? undefined : activeFilter === 'active'
      const result = await exerciseRepository.list({ search, active, anatomicalStructureId: structureFilter || undefined, kind: kindFilter === 'all' ? undefined : kindFilter as ExerciseKind, page, pageSize })
      setExercises(result.items); setTotal(result.total)
      setAllExercises((await exerciseRepository.list({ pageSize: 500 })).items)
    } catch { setError('Não foi possível carregar os exercícios.') }
    finally { setLoading(false) }
  }, [activeFilter, kindFilter, page, search, structureFilter])

  useEffect(() => {
    Promise.all([anatomicalStructureRepository.list({ pageSize: 100 }), painTypeRepository.list({ pageSize: 200 })])
      .then(([structureResult, painTypeResult]) => { setStructures(structureResult.items); setPainTypes(painTypeResult.items) })
      .catch(() => setError('Não foi possível carregar as opções de relacionamento.'))
  }, [])
  useEffect(() => { void load() }, [load])

  const startCreate = () => { setEditingId(null); setForm({ ...emptyForm, anatomicalStructureId: structures[0]?.id ?? '' }); setFormTab('data'); setScreen('form') }
  const closeForm = () => { setEditingId(null); setScreen('list') }
  const edit = (exercise: Exercise) => {
    setScreen('form')
    setFormTab('data')
    setEditingId(exercise.id)
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = exercise
    setForm({
      ...rest,
      targets: exercise.targets ?? [{ anatomicalStructureId: exercise.anatomicalStructureId, allPlacements: true }],
      youtubeUrl: exercise.youtubeUrl ?? '',
      painTypeIds: exercise.painTypeIds ?? [],
    })
  }
  function setNumber(key: 'sets' | 'reps' | 'durationSeconds' | 'restSeconds' | 'targetEffort' | 'painLimit', value: string) {
    setForm({ ...form, [key]: toNumber(value) })
  }
  function togglePainType(painTypeId: string) {
    const current = form.painTypeIds ?? []
    setForm({ ...form, painTypeIds: current.includes(painTypeId) ? current.filter((item) => item !== painTypeId) : [...current, painTypeId] })
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null)
    if (!form.name.trim() || !form.slug.trim() || !form.description.trim() || !form.instructions.trim()) {
      setError('Preencha nome, slug, descrição e instruções.')
      setFormTab('data')
      return
    }
    if (form.youtubeUrl && !isValidYoutubeUrl(form.youtubeUrl)) {
      setError('Informe uma URL válida do YouTube (youtube.com ou youtu.be).')
      setFormTab('data')
      return
    }
    if (form.targets.length === 0) {
      setError('Selecione pelo menos uma posição ou estrutura anatômica.')
      setFormTab('map')
      return
    }
    setSaving(true)
    try {
      const input = { ...form, anatomicalStructureId: form.targets[0].anatomicalStructureId }
      if (editingId) await exerciseRepository.update(editingId, input)
      else await exerciseRepository.create(input)
      closeForm(); await load()
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
    {error && <div className="alert" role="alert">{error}</div>}
    <section className={screen === 'form' ? 'card form-card' : 'hidden'} aria-label="Formulário de exercício"><h2>{editingId ? 'Editar exercício' : 'Novo exercício'}</h2><form onSubmit={submit} noValidate className="region-form">
      <div className="tab-bar"><button type="button" className={formTab === 'data' ? 'tab active' : 'tab'} onClick={() => setFormTab('data')}>Dados</button><button type="button" className={formTab === 'prescription' ? 'tab active' : 'tab'} onClick={() => setFormTab('prescription')}>Prescrição</button><button type="button" className={formTab === 'map' ? 'tab active' : 'tab'} onClick={() => setFormTab('map')}>Posições</button></div>
      <div className={formTab === 'prescription' ? 'form-fields' : 'hidden'}>
        <label>Fase do tratamento<select value={form.phase ?? ''} onChange={(event) => setForm({ ...form, phase: event.target.value ? Number(event.target.value) as TreatmentPhase : undefined })}><option value="">Não se aplica</option>{([1, 2, 3, 4] as TreatmentPhase[]).map((phase) => <option key={phase} value={phase}>{phaseLabels[phase]}</option>)}</select></label>
        <label>Estímulo<select value={form.stimulus ?? ''} onChange={(event) => setForm({ ...form, stimulus: (event.target.value || undefined) as PhaseStimulus | undefined })}><option value="">Não se aplica</option>{(Object.keys(stimulusLabels) as PhaseStimulus[]).map((stimulus) => <option key={stimulus} value={stimulus}>{stimulusLabels[stimulus]}</option>)}</select></label>
        <label>Séries<input type="number" min={0} value={form.sets ?? ''} onChange={(event) => setNumber('sets', event.target.value)} /></label>
        <label>Repetições<input type="number" min={0} value={form.reps ?? ''} onChange={(event) => setNumber('reps', event.target.value)} /></label>
        <label>Duração (segundos)<input type="number" min={0} value={form.durationSeconds ?? ''} onChange={(event) => setNumber('durationSeconds', event.target.value)} /></label>
        <label>Descanso (segundos)<input type="number" min={0} value={form.restSeconds ?? ''} onChange={(event) => setNumber('restSeconds', event.target.value)} /></label>
        <label>Cadência<input placeholder="Ex.: 3 s subindo / 3 s descendo" value={form.cadence ?? ''} onChange={(event) => setForm({ ...form, cadence: event.target.value })} /></label>
        <label>Esforço-alvo (0–10)<input type="number" min={0} max={10} placeholder="7" value={form.targetEffort ?? ''} onChange={(event) => setNumber('targetEffort', event.target.value)} /></label>
        <label>Limite de dor durante (0–10)<input type="number" min={0} max={10} placeholder="4" value={form.painLimit ?? ''} onChange={(event) => setNumber('painLimit', event.target.value)} /></label>
        <label>Equipamentos<input value={form.equipment ?? ''} onChange={(event) => setForm({ ...form, equipment: event.target.value })} /></label>
        <label className="wide">Erros principais<textarea rows={2} value={form.commonErrors ?? ''} onChange={(event) => setForm({ ...form, commonErrors: event.target.value })} /></label>
        <label className="wide">Orientação para o dia seguinte<textarea rows={2} value={form.nextDayGuidance ?? ''} onChange={(event) => setForm({ ...form, nextDayGuidance: event.target.value })} /></label>
        <label>Progressão<select value={form.progressionExerciseId ?? ''} onChange={(event) => setForm({ ...form, progressionExerciseId: event.target.value || undefined })}><option value="">Nenhuma</option>{allExercises.filter((item) => item.id !== editingId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Regressão<select value={form.regressionExerciseId ?? ''} onChange={(event) => setForm({ ...form, regressionExerciseId: event.target.value || undefined })}><option value="">Nenhuma</option>{allExercises.filter((item) => item.id !== editingId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <fieldset className="wide toggle-field"><legend>Tipos de dor possíveis neste exercício</legend><div className="chip-group">{painTypes.filter((painType) => painType.active).map((painType) => <button key={painType.id} type="button" className={(form.painTypeIds ?? []).includes(painType.id) ? 'chip selected' : 'chip'} aria-pressed={(form.painTypeIds ?? []).includes(painType.id)} onClick={() => togglePainType(painType.id)}>{painType.name}{painType.isAlertSign ? ' ⚠' : ''}</button>)}{painTypes.length === 0 && <span className="muted">Cadastre tipos de dor no menu “Tipos de dor”.</span>}</div></fieldset>
        <label className="checkbox wide"><input type="checkbox" checked={form.allowOtherPainDescription ?? false} onChange={(event) => setForm({ ...form, allowOtherPainDescription: event.target.checked })} /> Permitir “Outro” com descrição livre do usuário</label>
      </div>
      <div className={formTab === 'map' ? 'wide' : 'hidden'}>
      <div className="wide"><p className="muted">Clique nos markers para selecionar ou remover posições. Os selecionados ficam azuis.</p><BodyPainMap regions={[]} selectedRegionId="" structureOptions={structures.map((structure) => ({ id: structure.id, label: structure.name, placements: structure.mapPlacements }))} selectedStructureId={form.targets[0]?.anatomicalStructureId} selectedPlacement={form.targets[0]?.placement} isStructureSelected={(structureId, placement) => { const selected = form.targets.some((item) => item.anatomicalStructureId === structureId && item.placement?.face === placement.face && item.placement?.side === placement.side); console.debug('[Exercises] estado visual do marker', { structureId, placement, selected }); return selected }} onSelect={() => undefined} onSelectStructure={(structureId, placement) => { const exists = form.targets.some((item) => item.anatomicalStructureId === structureId && item.placement?.face === placement.face && item.placement?.side === placement.side); const targets = exists ? form.targets.filter((item) => !(item.anatomicalStructureId === structureId && item.placement?.face === placement.face && item.placement?.side === placement.side)) : [...form.targets, { anatomicalStructureId: structureId, placement }]; console.info('[Exercises] alternando target', { structureId, placement, exists, targets }); setForm({ ...form, anatomicalStructureId: structureId, targets }) }} /></div>
      </div>
      <div className={formTab === 'data' ? 'form-fields' : 'hidden'}>
      <label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>Slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
      <fieldset className="toggle-field"><legend>Tipo</legend><div className="toggle-group" role="group" aria-label="Tipo de exercício"><button className={form.kind === 'therapeutic' ? 'toggle-option selected' : 'toggle-option'} type="button" aria-pressed={form.kind === 'therapeutic'} onClick={() => setForm({ ...form, kind: 'therapeutic' })}>Terapêutico</button><button className={form.kind === 'evaluation' ? 'toggle-option selected' : 'toggle-option'} type="button" aria-pressed={form.kind === 'evaluation'} onClick={() => setForm({ ...form, kind: 'evaluation' })}>Avaliativo</button></div></fieldset>
      <label className="wide">Descrição<textarea required rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <label className="wide">Instruções<textarea required rows={3} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} /></label>
      <label className="wide">Vídeo do YouTube (opcional)<input type="url" placeholder="https://www.youtube.com/watch?v=..." value={form.youtubeUrl} onChange={(event) => setForm({ ...form, youtubeUrl: event.target.value })} /></label>
      <label className="checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Ativo</label></div>
      <FormWizardActions tabIndex={formTab === 'data' ? 0 : formTab === 'prescription' ? 1 : 2} tabCount={3} isEditing={editingId !== null} saving={saving} saveLabel="Salvar exercício" onPrevious={() => setFormTab(formTab === 'map' ? 'prescription' : 'data')} onNext={() => setFormTab(formTab === 'data' ? 'prescription' : 'map')} onCancel={closeForm} />
    </form></section>
    <section className={screen === 'list' ? 'card' : 'hidden'} aria-label="Lista de exercícios"><div className="list-toolbar"><h1>Exercícios</h1><button type="button" onClick={startCreate}>Novo exercício</button></div><div className="filters">
      <label>Buscar<input placeholder="Nome ou slug" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label>
      <label>Estrutura<select value={structureFilter} onChange={(event) => { setStructureFilter(event.target.value); setPage(1) }}><option value="">Todas</option>{structures.map((structure) => <option key={structure.id} value={structure.id}>{structure.name}</option>)}</select></label>
      <label>Status<select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1) }}><option value="all">Todos</option><option value="active">Ativos</option><option value="inactive">Inativos</option></select></label>
      <label>Tipo<select value={kindFilter} onChange={(event) => { setKindFilter(event.target.value); setPage(1) }}><option value="all">Todos</option><option value="therapeutic">Terapêuticos</option><option value="evaluation">Avaliativos</option></select></label>
    </div>
    {loading ? <p className="muted">Carregando...</p> : exercises.length === 0 ? <p className="muted empty-state">Nenhum exercício encontrado.</p> : <><div className="table-wrap"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Estrutura</th><th>Vídeo</th><th>Status</th><th>Ações</th></tr></thead><tbody>{exercises.map((exercise) => <tr key={exercise.id}><td><strong>{exercise.name}</strong><br /><span className="muted">{exercise.description}</span></td><td>{exercise.kind === 'evaluation' ? 'Avaliativo' : 'Terapêutico'}</td><td>{structureName(exercise.anatomicalStructureId)}</td><td>{exercise.youtubeUrl ? <a href={exercise.youtubeUrl} target="_blank" rel="noreferrer">Assistir vídeo</a> : <span className="muted">—</span>}</td><td><span className={exercise.active ? 'status status-active' : 'status'}>{exercise.active ? 'Ativo' : 'Inativo'}</span></td><td><div className="row-actions"><button className="link-button" type="button" onClick={() => edit(exercise)}>Editar</button><button className="link-button danger" type="button" disabled={deletingId === exercise.id} onClick={() => void remove(exercise)}>{deletingId === exercise.id ? 'Excluindo...' : 'Excluir'}</button></div></td></tr>)}</tbody></table></div><div className="pagination"><span className="muted">{total} resultado(s)</span><div><button className="secondary" type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span> Página {page} de {totalPages} </span><button className="secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</button></div></div></>}
    </section>
  </>
}
