import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { CreatePainTypeInput, PainType } from '@/domain/pain-types'
import { painTypeRepository } from '@/infrastructure/repositories/pain-types/InMemoryPainTypeRepository'

const pageSize = 8
const emptyForm: CreatePainTypeInput = { name: '', slug: '', description: '', isAlertSign: false, active: true }

export function PainTypesPage() {
  const [painTypes, setPainTypes] = useState<PainType[]>([])
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
      const result = await painTypeRepository.list({ search, page, pageSize })
      setPainTypes(result.items); setTotal(result.total)
    } catch { setError('Não foi possível carregar os tipos de dor.') }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => { void load() }, [load])

  const startCreate = () => { setEditingId(null); setForm(emptyForm); setScreen('form') }
  const startEdit = (painType: PainType) => {
    setEditingId(painType.id)
    setForm({ name: painType.name, slug: painType.slug, description: painType.description, isAlertSign: painType.isAlertSign, active: painType.active })
    setScreen('form')
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null)
    try {
      if (editingId) await painTypeRepository.update(editingId, form)
      else await painTypeRepository.create(form)
      setScreen('list'); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o tipo de dor.') }
    finally { setSaving(false) }
  }

  async function remove(painType: PainType) {
    if (!window.confirm(`Excluir o tipo de dor "${painType.name}"?`)) return
    setDeletingId(painType.id); setError(null)
    try {
      await painTypeRepository.delete(painType.id)
      if (painTypes.length === 1 && page > 1) setPage((current) => current - 1)
      else await load()
    } catch { setError('Não foi possível excluir o tipo de dor.') }
    finally { setDeletingId(null) }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return <>
    {error && <div className="alert" role="alert">{error}</div>}
    <section className={screen === 'form' ? 'card form-card' : 'hidden'} aria-label="Formulário de tipo de dor">
      <h2>{editingId ? 'Editar tipo de dor' : 'Novo tipo de dor'}</h2>
      <form onSubmit={submit} className="region-form">
        <label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label>Slug<input required value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></label>
        <label className="wide">Descrição<textarea required rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label className="checkbox"><input type="checkbox" checked={form.isAlertSign} onChange={(event) => setForm({ ...form, isAlertSign: event.target.checked })} /> Sinal de alerta (interrompe o fluxo e encaminha)</label>
        <label className="checkbox"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Ativo</label>
        <div className="form-actions wide"><button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button><button type="button" className="secondary" onClick={() => setScreen('list')}>Cancelar</button></div>
      </form>
    </section>
    <section className={screen === 'list' ? 'card' : 'hidden'} aria-label="Lista de tipos de dor">
      <div className="list-toolbar"><h1>Tipos de dor</h1><button type="button" onClick={startCreate}>Novo tipo de dor</button></div>
      <div className="filters"><label>Buscar<input placeholder="Nome ou slug" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} /></label></div>
      {loading ? <p className="muted">Carregando...</p> : painTypes.length === 0 ? <p className="muted empty-state">Nenhum tipo de dor encontrado.</p> : <>
        <div className="table-wrap"><table><thead><tr><th>Nome</th><th>Alerta</th><th>Status</th><th>Ações</th></tr></thead><tbody>{painTypes.map((painType) => <tr key={painType.id}><td><strong>{painType.name}</strong><br /><span className="muted">{painType.description}</span></td><td>{painType.isAlertSign ? '⚠ Sim' : '—'}</td><td><span className={painType.active ? 'status status-active' : 'status'}>{painType.active ? 'Ativo' : 'Inativo'}</span></td><td><div className="row-actions"><button className="link-button" type="button" onClick={() => startEdit(painType)}>Editar</button><button className="link-button danger" type="button" disabled={deletingId === painType.id} onClick={() => void remove(painType)}>{deletingId === painType.id ? 'Excluindo...' : 'Excluir'}</button></div></td></tr>)}</tbody></table></div>
        <div className="pagination"><span className="muted">{total} resultado(s)</span><div><button className="secondary" type="button" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Anterior</button><span> Página {page} de {totalPages} </span><button className="secondary" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Próxima</button></div></div>
      </>}
    </section>
  </>
}
