import { describe, expect, it } from 'vitest'
import { formatPrescription } from './prescription'

describe('formatPrescription', () => {
  it('descreve isometria em séries de tempo', () => {
    expect(formatPrescription({ sets: 4, durationSeconds: 45, restSeconds: 90, targetEffort: 7, painLimit: 4 })).toEqual([
      '4 séries de 45 s',
      'descanso 90 s',
      'esforço-alvo 7/10',
      'dor até 4/10',
    ])
  })

  it('descreve HSR com repetições, cadência e descanso em minutos', () => {
    expect(formatPrescription({ sets: 4, reps: 8, cadence: '3 s subindo / 3 s descendo', restSeconds: 180 })).toEqual([
      '4 séries de 8 repetições',
      'cadência 3 s subindo / 3 s descendo',
      'descanso 3 min',
    ])
  })

  it('prefere repetições quando há repetições e tempo', () => {
    expect(formatPrescription({ sets: 3, reps: 10, durationSeconds: 30 })[0]).toBe('3 séries de 10 repetições')
  })

  it('usa o singular e aceita volume sem séries', () => {
    expect(formatPrescription({ sets: 1, reps: 1 })[0]).toBe('1 série de 1 repetição')
    expect(formatPrescription({ reps: 10 })[0]).toBe('10 repetições')
    expect(formatPrescription({ durationSeconds: 30 })[0]).toBe('30 s')
  })

  it('retorna vazio quando não há prescrição', () => {
    expect(formatPrescription({})).toEqual([])
  })

  it('não exibe descanso zero e aceita esforço e limite zero', () => {
    expect(formatPrescription({ restSeconds: 0, painLimit: 0 })).toEqual(['dor até 0/10'])
  })
})
