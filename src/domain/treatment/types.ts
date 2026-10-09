export type TreatmentPhase = 1 | 2 | 3 | 4

export type PhaseStimulus = 'isometric' | 'hsr' | 'power' | 'return'

export const phaseLabels: Record<TreatmentPhase, string> = {
  1: 'Fase 1 — Controle inicial / Isometria',
  2: 'Fase 2 — Capacidade / HSR',
  3: 'Fase 3 — Absorção de energia e potência',
  4: 'Fase 4 — Retorno à vida / esporte',
}

export const stimulusLabels: Record<PhaseStimulus, string> = {
  isometric: 'Isometria',
  hsr: 'HSR (Heavy Slow Resistance)',
  power: 'Potência / absorção',
  return: 'Retorno / funcional',
}
