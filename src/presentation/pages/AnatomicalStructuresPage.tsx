import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { AnatomicalStructure, CreateAnatomicalStructureInput } from '@/domain/anatomical-structures'
import { anatomicalStructureRepository } from '@/infrastructure/repositories/anatomical-structures/InMemoryAnatomicalStructureRepository'
import { BodyPainMap, painMapRegions } from '@/presentation/components/BodyPainMap'
import type { AnatomicalMapPlacement } from '@/domain/common/types'

const pageSize = 5
const defaultPlacements: AnatomicalMapPlacement[] = [
  { face: 'anterior', side: 'right', left: '12.5%', top: '50%' },
  { face: 'anterior', side: 'left', left: '37.5%', top: '50%' },
  { face: 'posterior', side: 'left', left: '63.5%', top: '50%' },
  { face: 'posterior', side: 'right', left: '88.5%', top: '50%' },
]
const emptyForm: CreateAnatomicalStructureInput = { name: '', slug: '', description: '', active: true, mapPosition: undefined, mapPlacements: defaultPlacements }

export function AnatomicalStructuresPage() {
  const [structures, setStructures] = useState<AnatomicalStructure[]>([])
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [placementFace, setPlacementFace] = useState<'anterior' | 'posterior'>('anterior')
  const [placementSide, setPlacementSide] = useState<'left' | 'right'>('left')
  const [selectedPlacement, setSelectedPlacement] = useState<AnatomicalMapPlacement | undefined>()

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const active = activeFilter === 'all' ? undefined : activeFilter === 'active'
      const result = await anatomicalStructureRepository.list({ search, active, page, pageSize })
      setStructures(result.items); setTotal(result.total)
    } catch { setError('Não foi possível carregar as estruturas anatômicas.') }
    finally { setLoading(false) }
  }, [activeFilter, page, search])

  useEffect(() => { void load() }, [load])

  const resetForm = () => { setEditingId(null); setSelectedPlacement(undefined); setForm({ ...emptyForm, mapPlacements: [...defaultPlacements] }) }
  const edit = (structure: AnatomicalStructure) => {
    setEditingId(structure.id)
    const firstPlacement = structure.mapPlacements?.[0]
    setPlacementFace(firstPlacement?.face ?? 'anterior')
    setPlacementSide(firstPlacement?.side ?? 'left')
    setSelectedPlacement(firstPlacement)
    setForm({ name: structure.name, slug: structure.slug, description: structure.description, active: structure.active, mapPosition: structure.mapPosition, mapPlacements: structure.mapPlacements })
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null)
    if (!form.mapPlacements || form.mapPlacements.length < 2) {
      setError('Configure pelo menos duas posições (lado e face) no mapa.')
      setSaving(false)
      return
    }
    console.info('[AnatomicalStructures] salvando estrutura', {
      editingId,
      name: form.name,
      mapPlacements: form.mapPlacements,
    })
    try {
      if (editingId) await anatomicalStructureRepository.update(editingId, form)
      else await anatomicalStructureRepository.create(form)
      resetForm(); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a estrutura anatômica.') }
    finally { setSaving(false) }
  }
  async function remove(structure: AnatomicalStructure) {
    if (!window.confirm(`Excluir a estrutura "${structure.name}"?`)) return
    setDeletingId(structure.id); setError(null)
    try { await anatomicalStructureRepository.delete(structure.id); if (structures.length === 1 && page > 1) setPage((current) => current - 1); else await load() }
    catch { setError('Não foi possível excluir a estrutura anatômica.') }
    finally { setDeletingId(null) }
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return <>
    <div className="page-heading"><div><p className="eyebrow">Cadastros</p><h1>Estruturas anatômicas</h1><p className="muted">Gerencie estruturas e relacione-as às regiões do corpo.</p></div><button type="button" onClick={resetForm}>Nova estrutura</button></div>
    {error && <div className="alert" role="alert">{error}</div>}
    <section className="card form-card" aria-label="Formulário de estrutura anatômica"><h2>{editingId ? 'Editar estrutura' : 'Nova estrutura'}</h2><form onSubmit={submit} className="region-form">
      <div className="wide"><p className="muted">Arraste os quatro marcadores para as posições anatômicas. Selecione um marker antes de usar a lixeira.</p><BodyPainMap regions={[]} selectedRegionId="" structureOptions={[{ id: editingId ?? 'draft', label: form.name || 'Estrutura', placements: form.mapPlacements }]} selectedStructureId={editingId ?? 'draft'} selectedPlacement={selectedPlacement} placementEditor showQuadrantGuides placementFace={placementFace} placementSide={placementSide} onSelect={() => undefined} onSelectStructure={(_, placement) => { setSelectedPlacement(placement); if (!(form.mapPlacements ?? []).some((item) => item.face === placement.face && item.side === placement.side)) setForm({ ...form, mapPlacements: [...(form.mapPlacements ?? []), placement] }) }} onPlacementAdd={(placement) => { if ((form.mapPlacements ?? []).length >= 4) return; setSelectedPlacement(placement); setForm({ ...form, mapPlacements: [...(form.mapPlacements ?? []), placement] }) }} onPlacementMove={(next) => { if (!selectedPlacement) return; const current = form.mapPlacements ?? []; const index = current.indexOf(selectedPlacement); if (index < 0 || current.some((item, itemIndex) => itemIndex !== index && item.face === next.face && item.side === next.side)) return; const updated = [...current]; updated[index] = next; setSelectedPlacement(next); setForm({ ...form, mapPlacements: updated }) }} onPlacementRemove={(placement) => { setSelectedPlacement(undefined); setForm({ ...form, mapPlacements: (form.mapPlacements ?? []).filter((item) => item !== placement) }) }} /></div>
      <label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
      <label>Slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
      <label className="wide">Descrição<textarea required rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
      <label className="checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Ativa</label>
      <div className="form-actions"><button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>{editingId && <button type="button" className="secondary" onClick={resetForm}>Cancelar</button>}</div>
    </form></section>
    <section className="card" aria-label="Lista de estruturas anatômicas"><div className="filters">
      <label>Buscar<input placeholder="Nome ou slug" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label>
      <label>Status<select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1) }}><option value="all">Todos</option><option value="active">Ativas</option><option value="inactive">Inativas</option></select></label>
    </div>
    {loading ? <p className="muted">Carregando...</p> : structures.length === 0 ? <p className="muted empty-state">Nenhuma estrutura encontrada.</p> : <><div className="table-wrap"><table><thead><tr><th>Nome</th><th>Status</th><th>Ações</th></tr></thead><tbody>{structures.map((structure) => <tr key={structure.id}><td><strong>{structure.name}</strong><br /><span className="muted">{structure.description}</span></td><td><span className={structure.active ? 'status status-active' : 'status'}>{structure.active ? 'Ativa' : 'Inativa'}</span></td><td><div className="row-actions"><button className="link-button" type="button" onClick={() => edit(structure)}>Editar</button><button className="link-button danger" type="button" disabled={deletingId === structure.id} onClick={() => void remove(structure)}>{deletingId === structure.id ? 'Excluindo...' : 'Excluir'}</button></div></td></tr>)}</tbody></table></div><div className="pagination"><span className="muted">{total} resultado(s)</span><div><button className="secondary" type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span> Página {page} de {totalPages} </span><button className="secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</button></div></div></>}
    </section>
  </>
}
