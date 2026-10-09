import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { loadSeeded } from './seedStorage'

interface Item {
  id: string
  name: string
}

class FakeStorage {
  private readonly data = new Map<string, string>()
  getItem(key: string) {
    return this.data.get(key) ?? null
  }
  setItem(key: string, value: string) {
    this.data.set(key, value)
  }
}

const seed: Item[] = [
  { id: 'a', name: 'seed A' },
  { id: 'b', name: 'seed B' },
]

let storage: FakeStorage

beforeEach(() => {
  storage = new FakeStorage()
  vi.stubGlobal('window', { localStorage: storage })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('loadSeeded', () => {
  it('usa o seed quando não há dados salvos e registra a versão', () => {
    expect(loadSeeded({ storageKey: 'k', seed, version: 'v1' })).toEqual(seed)
    expect(storage.getItem('k:seed-version')).toBe('v1')
  })

  it('retorna os dados salvos quando a versão já foi aplicada', () => {
    storage.setItem('k', JSON.stringify([{ id: 'x', name: 'meu' }]))
    storage.setItem('k:seed-version', 'v1')
    expect(loadSeeded({ storageKey: 'k', seed, version: 'v1' })).toEqual([{ id: 'x', name: 'meu' }])
  })

  it('mescla o seed novo preservando edições existentes com o mesmo id', () => {
    storage.setItem('k', JSON.stringify([{ id: 'a', name: 'editado pelo admin' }, { id: 'x', name: 'meu' }]))
    storage.setItem('k:seed-version', 'v1')
    const result = loadSeeded({ storageKey: 'k', seed, version: 'v2' })
    expect(result.map((item) => item.id)).toEqual(['a', 'x', 'b'])
    expect(result.find((item) => item.id === 'a')?.name).toBe('editado pelo admin')
    expect(storage.getItem('k:seed-version')).toBe('v2')
    expect(JSON.parse(storage.getItem('k') ?? '[]')).toHaveLength(3)
  })

  it('remove ids antigos e recria os que o seed reaproveita', () => {
    storage.setItem('k', JSON.stringify([{ id: 'old', name: 'antigo' }, { id: 'a', name: 'a antigo' }, { id: 'x', name: 'meu' }]))
    const result = loadSeeded({ storageKey: 'k', seed, version: 'v2', legacyIds: ['old', 'a'] })
    expect(result.map((item) => item.id).sort()).toEqual(['a', 'b', 'x'])
    expect(result.find((item) => item.id === 'a')?.name).toBe('seed A')
  })

  it('aplica mergeExisting a itens salvos que também existem no seed, sem recriá-los', () => {
    storage.setItem('k', JSON.stringify([{ id: 'a', name: 'editado pelo admin' }, { id: 'x', name: 'meu' }]))
    const result = loadSeeded({
      storageKey: 'k',
      seed,
      version: 'v2',
      mergeExisting: (stored, seedItem) => ({ ...stored, name: `${stored.name} (+${seedItem.id})` }),
    })
    expect(result.find((item) => item.id === 'a')?.name).toBe('editado pelo admin (+a)')
    expect(result.find((item) => item.id === 'x')?.name).toBe('meu')
    expect(result.find((item) => item.id === 'b')?.name).toBe('seed B')
  })

  it('não repete a migração depois de aplicada', () => {
    storage.setItem('k', JSON.stringify([{ id: 'x', name: 'meu' }]))
    const first = loadSeeded({ storageKey: 'k', seed, version: 'v2' })
    storage.setItem('k', JSON.stringify(first.filter((item) => item.id !== 'b')))
    expect(loadSeeded({ storageKey: 'k', seed, version: 'v2' }).map((item) => item.id)).toEqual(['x', 'a'])
  })

  it('ignora conteúdo salvo inválido', () => {
    storage.setItem('k', '{não é json')
    expect(loadSeeded({ storageKey: 'k', seed, version: 'v1' })).toEqual(seed)
    storage.setItem('k', JSON.stringify({ nao: 'array' }))
    expect(loadSeeded({ storageKey: 'k', seed, version: 'v1' })).toEqual(seed)
  })

  it('retorna o seed fora do navegador', () => {
    vi.unstubAllGlobals()
    expect(loadSeeded({ storageKey: 'k', seed, version: 'v1' })).toEqual(seed)
  })
})
