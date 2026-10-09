interface SeedOptions<T extends { id: string }> {
  storageKey: string
  seed: T[]
  /** Altere para republicar o seed em quem já tem dados salvos no navegador. */
  version: string
  /** Ids de dados de exemplo antigos que devem ser removidos na migração. */
  legacyIds?: string[]
  /** Atualiza um item já salvo com dados do seed (ex.: preencher campos ausentes), sem recriá-lo. */
  mergeExisting?: (stored: T, seed: T) => T
}

function readStored<T>(storageKey: string): T[] | null {
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : null
  } catch {
    return null
  }
}

/**
 * Carrega os dados salvos e, quando a versão do seed mudou, mescla os itens novos
 * sem sobrescrever edições do admin (itens existentes com o mesmo id são preservados).
 */
export function loadSeeded<T extends { id: string }>({
  storageKey,
  seed,
  version,
  legacyIds = [],
  mergeExisting,
}: SeedOptions<T>): T[] {
  if (typeof window === 'undefined') return [...seed]

  const versionKey = `${storageKey}:seed-version`
  const stored = readStored<T>(storageKey)

  if (!stored) {
    window.localStorage.setItem(versionKey, version)
    return [...seed]
  }
  if (window.localStorage.getItem(versionKey) === version) return stored

  const legacy = new Set(legacyIds)
  const seedById = new Map(seed.map((item) => [item.id, item]))
  const kept = stored
    .filter((item) => !legacy.has(item.id))
    .map((item) => {
      const seedItem = seedById.get(item.id)
      return seedItem && mergeExisting ? mergeExisting(item, seedItem) : item
    })
  const existing = new Set(kept.map((item) => item.id))
  const merged = [...kept, ...seed.filter((item) => !existing.has(item.id))]

  window.localStorage.setItem(storageKey, JSON.stringify(merged))
  window.localStorage.setItem(versionKey, version)
  return merged
}
