import type { PainType } from '@/domain/pain-types'

const base = { active: true, createdAt: '2026-04-01T12:00:00.000Z', updatedAt: '2026-04-01T12:00:00.000Z' }

export const painTypesMock: PainType[] = [
  { id: 'local-tendon', name: 'Dor localizada no tendão', slug: 'dor-localizada-tendao', description: 'Dor bem localizada no ponto do tendão, que aparece ao carregar.', isAlertSign: false, ...base },
  { id: 'stiffness', name: 'Rigidez', slug: 'rigidez', description: 'Sensação de rigidez, principalmente ao iniciar o movimento.', isAlertSign: false, ...base },
  { id: 'pinching', name: 'Pontada', slug: 'pontada', description: 'Dor aguda e rápida durante parte do movimento.', isAlertSign: false, ...base },
  { id: 'burning', name: 'Queimação', slug: 'queimacao', description: 'Sensação de ardência na região.', isAlertSign: false, ...base },
  { id: 'tingling', name: 'Formigamento ou dormência', slug: 'formigamento-dormencia', description: 'Sintoma neurológico: sinal de alerta.', isAlertSign: true, ...base },
  { id: 'sudden-weakness', name: 'Perda súbita de força', slug: 'perda-subita-forca', description: 'Perda repentina de força no membro: sinal de alerta.', isAlertSign: true, ...base },
  { id: 'swelling', name: 'Inchaço na região', slug: 'inchaco-regiao', description: 'Inchaço significativo na região: sinal de alerta.', isAlertSign: true, ...base },
  { id: 'unable-to-perform', name: 'Não consegui executar o movimento', slug: 'nao-consegui-executar', description: 'Incapacidade de executar o teste proposto: sinal de alerta.', isAlertSign: true, ...base },
]

export const painTypesSeedVersion = '2026-10-09-escopo-v2'
