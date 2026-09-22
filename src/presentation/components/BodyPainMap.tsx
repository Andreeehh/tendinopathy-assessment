import styles from './BodyPainMap.module.css'
import { useRef } from 'react'
import type { PointerEvent } from 'react'
import type { AnatomicalMapPlacement, MapFace } from '@/domain/common/types'

export interface PainMapRegion {
  id: string
  label: string
  position: { left: string; top: string }
  supportsSide: boolean
}

interface BodyPainMapProps {
  regions: PainMapRegion[]
  selectedRegionId: string
  onSelect: (regionId: string) => void
  onMapClick?: (position: { left: string; top: string }) => void
  structureOptions?: Array<{ id: string; label: string; placements?: AnatomicalMapPlacement[] }>
  selectedStructureId?: string
  selectedPlacement?: AnatomicalMapPlacement
  onSelectStructure?: (structureId: string, placement: AnatomicalMapPlacement) => void
  isStructureSelected?: (structureId: string, placement: AnatomicalMapPlacement) => boolean
  placementFace?: MapFace
  placementSide?: 'left' | 'right'
  placementEditor?: boolean
  onPlacementMove?: (placement: AnatomicalMapPlacement) => void
  onPlacementRemove?: (placement: AnatomicalMapPlacement) => void
  onPlacementAdd?: (placement: AnatomicalMapPlacement) => void
  showQuadrantGuides?: boolean
}

export const painMapRegions: PainMapRegion[] = [
  { id: 'head', label: 'Cabeça', position: { left: '25%', top: '13%' }, supportsSide: false },
  { id: 'neck', label: 'Pescoço', position: { left: '25%', top: '24%' }, supportsSide: false },
  { id: 'upper-limb', label: 'Membros superiores', position: { left: '14%', top: '43%' }, supportsSide: true },
  { id: 'trunk', label: 'Tronco', position: { left: '25%', top: '45%' }, supportsSide: false },
  { id: 'lower-limb', label: 'Membros inferiores', position: { left: '25%', top: '78%' }, supportsSide: true },
]

export function BodyPainMap({
  regions,
  selectedRegionId,
  onSelect,
  onMapClick,
  structureOptions = [],
  selectedStructureId = '',
  onSelectStructure,
  isStructureSelected,
  selectedPlacement,
  placementFace = 'anterior',
  placementSide = 'left',
  placementEditor = false,
  onPlacementMove,
  onPlacementRemove,
  onPlacementAdd,
  showQuadrantGuides = false,
}: BodyPainMapProps) {
  const dragging = useRef<number | null>(null)
  function classifyPosition(left: number, top: number): AnatomicalMapPlacement {
    const face = left < 52 ? 'anterior' : 'posterior'
    const side = left < 25.1 || (left >= 52 && left < 77.4) ? 'right' : 'left'
    return { left: `${left}%`, top: `${top}%`, face, side }
  }

  function placementKey(placement: AnatomicalMapPlacement) {
    return `${placement.face}-${placement.side}`
  }

  function movePlacement(event: PointerEvent<HTMLButtonElement>, placement: AnatomicalMapPlacement) {
    if (!placementEditor || !onPlacementMove) return
    if (dragging.current !== event.pointerId) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const map = event.currentTarget.closest(`.${styles.bodyMap}`)
    if (!(map instanceof HTMLElement)) return
    const rect = map.getBoundingClientRect()
    const left = Math.max(1, Math.min(99, ((event.clientX - rect.left) / rect.width) * 100))
    const top = Math.max(1, Math.min(99, ((event.clientY - rect.top) / rect.height) * 100))
    onPlacementMove(classifyPosition(left, top))
  }

  return (
    <div className={styles.mapPanel}>
      <div className={styles.bodyMap} aria-label="Mapa corporal anterior e posterior" onClick={(event) => {
        if (!onMapClick || (event.target instanceof HTMLButtonElement)) return
        const rect = event.currentTarget.getBoundingClientRect()
        onMapClick({ left: `${((event.clientX - rect.left) / rect.width) * 100}%`, top: `${((event.clientY - rect.top) / rect.height) * 100}%` })
      }}>
        {showQuadrantGuides && <><span className={`${styles.guideLine} ${styles.guide25}`} /><span className={`${styles.guideLine} ${styles.guide50}`} /><span className={`${styles.guideLine} ${styles.guide77}`} /></>}
        {placementEditor && <div className={styles.mapActions}><button className={styles.trash} type="button" aria-label="Remover posição anatômica" onClick={() => selectedPlacement && onPlacementRemove?.(selectedPlacement)}>🗑</button><button className={styles.addPosition} type="button" aria-label="Adicionar posição anatômica" onClick={() => { const defaults: AnatomicalMapPlacement[] = [{ face: 'anterior', side: 'right', left: '12.5%', top: '50%' }, { face: 'anterior', side: 'left', left: '37.5%', top: '50%' }, { face: 'posterior', side: 'left', left: '63.5%', top: '50%' }, { face: 'posterior', side: 'right', left: '88.5%', top: '50%' }]; const next = defaults.find((candidate) => !(structureOptions[0]?.placements ?? []).some((item) => placementKey(item) === placementKey(candidate))); if (next) onPlacementAdd?.(next) }}>＋</button></div>}
        <img
          className={styles.bodyIllustration}
          src="/Muscles_front_and_back.svg"
          alt="Ilustração anatômica dos músculos do corpo, frente e costas"
        />
        {regions.map((region) => {
          const position = region.position
          return (
            <button
              className={selectedRegionId === region.id ? styles.hotspotSelected : styles.hotspot}
              key={region.id}
              type="button"
              style={{ left: position.left, top: position.top }}
              aria-label={`Selecionar área: ${region.label}`}
              aria-pressed={selectedRegionId === region.id}
              onClick={(event) => { event.stopPropagation(); onSelect(region.id) }}
            >
              <span aria-hidden="true" />
              <strong>{region.label}</strong>
            </button>
          )
        })}
        {structureOptions.flatMap((structure) => {
          const placements = structure.placements?.length ? structure.placements : [
            { face: 'anterior' as const, side: 'right' as const, left: '12.5%', top: '50%' },
            { face: 'anterior' as const, side: 'left' as const, left: '37.5%', top: '50%' },
            { face: 'posterior' as const, side: 'left' as const, left: '63.5%', top: '50%' },
            { face: 'posterior' as const, side: 'right' as const, left: '88.5%', top: '50%' },
          ]
          return placements.map((placement) => (
            <button
              className={isStructureSelected?.(structure.id, placement) || (selectedStructureId === structure.id && selectedPlacement?.face === placement.face && selectedPlacement.side === placement.side) ? styles.structureSelected : styles.structureHotspot}
              key={`${structure.id}-${placementKey(placement)}`}
              type="button"
              style={{ left: placement.left, top: placement.top }}
              aria-label={`Selecionar estrutura: ${structure.label}, ${placement.side === 'left' ? 'lado esquerdo' : 'lado direito'}, ${placement.face === 'anterior' ? 'frente' : 'costas'}`}
              aria-pressed={Boolean(isStructureSelected?.(structure.id, placement) || (selectedStructureId === structure.id && selectedPlacement?.face === placement.face && selectedPlacement.side === placement.side))}
              onClick={(event) => {
                event.stopPropagation()
                console.info('[BodyPainMap] marker clicado', {
                  structureId: structure.id,
                  placement,
                })
                onSelectStructure?.(structure.id, placement)
              }}
              onPointerDown={(event) => {
                event.stopPropagation()
                if (!placementEditor) return
                onSelectStructure?.(structure.id, placement)
                dragging.current = event.pointerId
                event.currentTarget.setPointerCapture(event.pointerId)
              }}
              onPointerMove={(event) => movePlacement(event, placement)}
              onPointerUp={(event) => { dragging.current = null; event.currentTarget.releasePointerCapture(event.pointerId) }}
            >
              {structure.label}
            </button>
          ))
        })}
      </div>
      <p className={styles.legend}>
        Clique na estrutura anatômica. O SVG já apresenta as vistas anterior e posterior.
      </p>
    </div>
  )
}
