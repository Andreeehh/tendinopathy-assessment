import type { ExercisePrescription } from './Exercise'

function formatRest(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) return `${seconds / 60} min`
  return `${seconds} s`
}

function formatVolume(prescription: ExercisePrescription): string | undefined {
  const { sets, reps, durationSeconds } = prescription
  const unit =
    reps !== undefined && reps > 0
      ? `${reps} ${reps === 1 ? 'repetição' : 'repetições'}`
      : durationSeconds !== undefined && durationSeconds > 0
        ? `${durationSeconds} s`
        : undefined

  if (sets !== undefined && sets > 0) {
    const setsLabel = `${sets} ${sets === 1 ? 'série' : 'séries'}`
    return unit ? `${setsLabel} de ${unit}` : setsLabel
  }
  return unit
}

/** Resume a prescrição em partes curtas, na ordem em que o usuário as executa. */
export function formatPrescription(prescription: ExercisePrescription): string[] {
  const parts: string[] = []
  const volume = formatVolume(prescription)
  if (volume) parts.push(volume)
  if (prescription.cadence) parts.push(`cadência ${prescription.cadence}`)
  if (prescription.restSeconds !== undefined && prescription.restSeconds > 0) {
    parts.push(`descanso ${formatRest(prescription.restSeconds)}`)
  }
  if (prescription.targetEffort !== undefined) parts.push(`esforço-alvo ${prescription.targetEffort}/10`)
  if (prescription.painLimit !== undefined) parts.push(`dor até ${prescription.painLimit}/10`)
  return parts
}
