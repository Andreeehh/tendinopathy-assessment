import type { ExerciseGroup } from '@/domain/exercise-groups'

const timestamp = '2026-10-09T12:00:00.000Z'

interface Region {
  structureId: string
  label: string
  evaluationIds: string[]
  isometricIds: string[]
  hsrId: string
}

const regions: Region[] = [
  {
    structureId: 'shoulder',
    label: 'Ombro (manguito rotador)',
    evaluationIds: ['shoulder-eval-scaption', 'shoulder-eval-jobe', 'shoulder-eval-hawkins'],
    isometricIds: ['shoulder-iso-scaption', 'shoulder-iso-external-rotation'],
    hsrId: 'shoulder-hsr-scaption',
  },
  {
    structureId: 'elbow',
    label: 'Cotovelo (epicondilalgia lateral)',
    evaluationIds: ['elbow-eval-wrist-extension', 'elbow-eval-cozen', 'elbow-eval-maudsley'],
    isometricIds: ['elbow-iso-wrist-extension', 'elbow-iso-grip'],
    hsrId: 'elbow-hsr-wrist-extension',
  },
  {
    structureId: 'gluteus',
    label: 'Quadril (tendinopatia glútea)',
    evaluationIds: ['gluteus-eval-trochanter-palpation', 'gluteus-eval-abductor-strength', 'gluteus-eval-single-leg-stance'],
    isometricIds: ['gluteus-iso-abduction', 'gluteus-iso-bridge'],
    hsrId: 'gluteus-hsr-bridge',
  },
  {
    structureId: 'knee',
    label: 'Joelho (tendinopatia patelar)',
    evaluationIds: ['knee-eval-decline-squat', 'knee-eval-royal-london'],
    isometricIds: ['knee-iso-extension', 'knee-iso-wall-sit'],
    hsrId: 'knee-hsr-squat',
  },
  {
    structureId: 'ankle',
    label: 'Tornozelo (tendão de Aquiles)',
    evaluationIds: ['ankle-eval-heel-rise', 'ankle-eval-arc-sign', 'ankle-eval-royal-london', 'ankle-eval-pinch'],
    isometricIds: ['ankle-iso-heel-raise', 'ankle-iso-seated-calf'],
    hsrId: 'ankle-hsr-heel-raise',
  },
]

const base = { createdAt: timestamp, updatedAt: timestamp }

/**
 * Por região: bateria avaliativa, plano da Fase 1 (indicado pela avaliação inicial, dor máxima de 0 a 6)
 * e plano da Fase 2 (inativo: só é liberado por reavaliação, via motor de progressão).
 */
export const exerciseGroupsMock: ExerciseGroup[] = regions.flatMap((region) => [
  {
    id: `${region.structureId}-evaluation-battery`,
    kind: 'evaluation' as const,
    name: `Bateria de avaliação — ${region.label}`,
    slug: `bateria-avaliacao-${region.structureId}`,
    description: 'Testes aplicados na avaliação inicial. A maior dor registrada direciona o plano.',
    anatomicalStructureId: region.structureId,
    exerciseIds: region.evaluationIds,
    active: true,
    ...base,
  },
  {
    id: `${region.structureId}-plan-phase-1`,
    kind: 'plan' as const,
    name: `Plano Fase 1 — ${region.label}`,
    slug: `plano-fase-1-${region.structureId}`,
    description: 'Controle inicial com isometria (4 séries de 45 s, esforço 7/10, dor até 4/10). Indicado para dor máxima de 0 a 6 na bateria.',
    anatomicalStructureId: region.structureId,
    exerciseIds: region.isometricIds,
    minPain: 0,
    maxPain: 6,
    active: true,
    ...base,
  },
  {
    id: `${region.structureId}-plan-phase-2`,
    kind: 'plan' as const,
    name: `Plano Fase 2 — ${region.label}`,
    slug: `plano-fase-2-${region.structureId}`,
    description: 'Capacidade com HSR e manutenção de isometria em dias alternados. Liberado por reavaliação (Fase 1 → Fase 2), não pela avaliação inicial.',
    anatomicalStructureId: region.structureId,
    exerciseIds: [region.hsrId, ...region.isometricIds],
    minPain: 0,
    maxPain: 10,
    active: false,
    ...base,
  },
])

/** Grupos de exemplo antigos. Duas baterias reaproveitam o id e são recriadas com o conteúdo novo. */
export const legacyExerciseGroupIds = [
  'shoulder-evaluation-battery',
  'shoulder-plan-low',
  'shoulder-plan-moderate',
  'knee-evaluation-battery',
  'knee-plan-low',
  'knee-plan-moderate',
]

export const exerciseGroupsSeedVersion = '2026-10-09-escopo-v2'
