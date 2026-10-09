import { useEffect, useMemo, useState } from 'react'
import type { AnatomicalStructure } from '@/domain/anatomical-structures'
import type { ExerciseGroup } from '@/domain/exercise-groups'
import type { PainScore } from '@/domain/pain-assessment'
import type { AnatomicalMapPlacement } from '@/domain/common/types'
import type { Exercise } from '@/domain/exercises'
import type { PainType } from '@/domain/pain-types'
import { exerciseMatchesStructure, formatPrescription, getYoutubeEmbedUrl } from '@/domain/exercises'
import { createGroupRecommendationPlan } from '@/domain/recommendations'
import type { RecommendationPlan } from '@/domain/recommendations'
import { anatomicalStructureRepository } from '@/infrastructure/repositories/anatomical-structures/InMemoryAnatomicalStructureRepository'
import { exerciseGroupRepository } from '@/infrastructure/repositories/exercise-groups/InMemoryExerciseGroupRepository'
import { exerciseRepository } from '@/infrastructure/repositories/exercises/InMemoryExerciseRepository'
import { painAssessmentRepository } from '@/infrastructure/repositories/pain-assessment/InMemoryPainAssessmentRepository'
import { painTypeRepository } from '@/infrastructure/repositories/pain-types/InMemoryPainTypeRepository'
import { BodyPainMap } from '@/presentation/components/BodyPainMap'

const painScores = Array.from({ length: 11 }, (_, score) => score)

interface ExerciseAnswer {
  pain?: PainScore
  painTypeIds: string[]
  other: string
}

type Step = 1 | 2 | 3

export function UserAssessmentPage() {
  const [structures, setStructures] = useState<AnatomicalStructure[]>([])
  const [structureId, setStructureId] = useState('')
  const [side, setSide] = useState<'left' | 'right' | 'both' | 'not-applicable'>('not-applicable')
  const [face, setFace] = useState<'anterior' | 'posterior'>('anterior')
  const [placement, setPlacement] = useState<AnatomicalMapPlacement | undefined>()
  const [evaluationExercises, setEvaluationExercises] = useState<Exercise[]>([])
  const [therapeuticExercises, setTherapeuticExercises] = useState<Exercise[]>([])
  const [groups, setGroups] = useState<ExerciseGroup[]>([])
  const [painTypes, setPainTypes] = useState<PainType[]>([])
  const [answers, setAnswers] = useState<Record<string, ExerciseAnswer>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<RecommendationPlan | null>(null)
  const [step, setStep] = useState<Step>(1)

  useEffect(() => {
    Promise.all([
      anatomicalStructureRepository.list({ active: true, pageSize: 100 }),
      exerciseRepository.list({ active: true, pageSize: 500 }),
      exerciseGroupRepository.list({ active: true, pageSize: 500 }),
      painTypeRepository.list({ active: true, pageSize: 200 }),
    ])
      .then(([structureResult, exerciseResult, groupResult, painTypeResult]) => {
        setStructures(structureResult.items)
        setEvaluationExercises(exerciseResult.items.filter((exercise) => exercise.kind === 'evaluation'))
        setTherapeuticExercises(exerciseResult.items.filter((exercise) => exercise.kind === 'therapeutic'))
        setGroups(groupResult.items)
        setPainTypes(painTypeResult.items)
      })
      .catch(() => setError('Não foi possível carregar as áreas disponíveis.'))
      .finally(() => setLoading(false))
  }, [])

  const selectedStructure = structures.find((structure) => structure.id === structureId)

  // Bateria cadastrada para a estrutura; sem grupo, usa todos os avaliativos da estrutura.
  const battery = useMemo(() => {
    if (!structureId) return { name: undefined as string | undefined, exercises: [] as Exercise[] }
    const group = groups.find((item) => item.kind === 'evaluation' && item.anatomicalStructureId === structureId)
    if (group) {
      const byId = new Map(evaluationExercises.map((exercise) => [exercise.id, exercise]))
      const ordered = group.exerciseIds
        .map((id) => byId.get(id))
        .filter((exercise): exercise is Exercise => Boolean(exercise))
      if (ordered.length > 0) return { name: group.name, exercises: ordered }
    }
    return {
      name: undefined,
      exercises: evaluationExercises.filter((exercise) => exerciseMatchesStructure(exercise, structureId)),
    }
  }, [evaluationExercises, groups, structureId])

  const answeredCount = battery.exercises.filter((exercise) => answers[exercise.id]?.pain !== undefined).length
  const allAnswered = battery.exercises.length > 0 && answeredCount === battery.exercises.length

  function updateAnswer(exerciseId: string, change: Partial<ExerciseAnswer>) {
    setAnswers((current) => {
      const existing: ExerciseAnswer = (current[exerciseId] as ExerciseAnswer | undefined) ?? { painTypeIds: [], other: '' }
      return { ...current, [exerciseId]: { ...existing, ...change } }
    })
  }

  function togglePainType(exerciseId: string, painTypeId: string) {
    const selected = answers[exerciseId]?.painTypeIds ?? []
    updateAnswer(exerciseId, {
      painTypeIds: selected.includes(painTypeId) ? selected.filter((item) => item !== painTypeId) : [...selected, painTypeId],
    })
  }

  function goToStep(nextStep: Step) {
    if (nextStep < 3) setPlan(null)
    setStep(nextStep)
  }

  function selectStructure(structure: string, selectedPlacement: AnatomicalMapPlacement) {
    if (structure !== structureId) setAnswers({})
    setStructureId(structure)
    setPlacement(selectedPlacement)
    setSide(selectedPlacement.side)
    setFace(selectedPlacement.face)
    goToStep(2)
  }

  function restart() {
    setStructureId('')
    setPlacement(undefined)
    setAnswers({})
    goToStep(1)
  }

  async function submit() {
    setError(null)
    if (!selectedStructure || !allAnswered) {
      setError('Responda todos os exercícios avaliativos antes de ver as recomendações.')
      return
    }
    setSubmitting(true)
    try {
      const results = battery.exercises.map((exercise) => ({
        exerciseId: exercise.id,
        painScore: answers[exercise.id].pain as PainScore,
      }))
      const maxPain = Math.max(...results.map((result) => result.painScore)) as PainScore
      const alertSigns = battery.exercises.flatMap((exercise) =>
        painTypes
          .filter((painType) => painType.isAlertSign && (answers[exercise.id]?.painTypeIds ?? []).includes(painType.id))
          .map((painType) => painType.name),
      )

      const session = await painAssessmentRepository.createSession({
        userId: 'demo-user',
        painArea: {
          anatomicalStructureId: structureId,
          side: side === 'not-applicable' ? undefined : side,
          face,
        },
        initialPainScore: maxPain,
      })
      for (const exercise of battery.exercises) {
        const answer = answers[exercise.id]
        await painAssessmentRepository.recordResponse(session.id, {
          exerciseId: exercise.id,
          painDuring: answer.pain,
          completed: true,
          painTypeIds: answer.painTypeIds,
          otherPainDescription: answer.other.trim() || undefined,
        })
      }

      setPlan(createGroupRecommendationPlan({
        results,
        totalCount: battery.exercises.length,
        painArea: session.painArea,
        plans: groups.filter((group) => group.kind === 'plan'),
        exercises: therapeuticExercises,
        sessionId: session.id,
        alertSigns: [...new Set(alertSigns)],
      }))
      setStep(3)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível concluir a avaliação.')
    } finally {
      setSubmitting(false)
    }
  }

  const exerciseName = (id: string) => battery.exercises.find((exercise) => exercise.id === id)?.name ?? id
  const levelLabel = plan?.painLevel === 'low' ? 'baixo' : plan?.painLevel === 'moderate' ? 'moderado' : 'alto'

  return (
    <main className="user-shell">
      <div className="user-content">
        {step === 1 && (
          <>
            <p className="eyebrow">Avaliação inicial</p>
            <h1>Encontre exercícios para sua dor</h1>
            <p className="muted">Informe onde dói, faça os testes indicados e registre a dor de cada um.</p>
          </>
        )}
        {error && <div className="alert" role="alert">{error}</div>}
        {loading ? <section className="card"><p className="muted">Carregando áreas...</p></section> : (
          <>
            <section key={`assessment-step-${step}`} className={step === 1 ? 'card user-form-card assessment-step visible' : 'card user-form-card assessment-step'}>
              <h2>1. Onde está a dor?</h2>
              <BodyPainMap
                regions={[]}
                selectedRegionId=""
                onSelect={() => undefined}
                structureOptions={structures.map((structure) => ({ id: structure.id, label: structure.name, placements: structure.mapPlacements }))}
                selectedStructureId={structureId}
                selectedPlacement={placement}
                placementFace={face}
                placementSide={side === 'right' ? 'right' : 'left'}
                onSelectStructure={selectStructure}
              />
              <div className="user-form">
                <p className="selection-summary">{selectedStructure ? `Estrutura selecionada: ${selectedStructure.name}` : 'Selecione uma estrutura no mapa.'}</p>
                <p className="selection-summary">{structureId && placement ? `Posição: ${placement.face === 'anterior' ? 'frente' : 'costas'} — ${placement.side === 'right' ? 'lado direito' : 'lado esquerdo'}` : 'Selecione uma posição no mapa.'}</p>
              </div>
              <div className="step-actions"><span /><button type="button" disabled={!structureId} onClick={() => goToStep(2)}>Avançar</button></div>
            </section>

            <section key={`assessment-step-${step}-battery`} className={step === 2 ? 'card user-form-card assessment-step visible' : 'card user-form-card assessment-step'}>
              <h2>2. Faça os exercícios avaliativos</h2>
              <p className="muted">{battery.name ? `${battery.name}. ` : ''}Execute cada movimento dentro do seu limite confortável e registre a dor sentida (0 = nenhuma dor, 10 = pior dor imaginável).</p>
              {battery.exercises.length === 0 ? <p className="muted empty-state">Nenhum exercício avaliativo disponível para essa área.</p> : (
                <>
                  <p className="battery-progress" aria-live="polite">{answeredCount} de {battery.exercises.length} exercícios respondidos</p>
                  <div className="battery-list">
                    {battery.exercises.map((exercise, index) => {
                      const embedUrl = exercise.youtubeUrl ? getYoutubeEmbedUrl(exercise.youtubeUrl) : null
                      const answer = answers[exercise.id]
                      const exercisePainTypes = painTypes.filter((painType) => exercise.painTypeIds?.includes(painType.id))
                      return (
                        <article className="battery-item" key={exercise.id}>
                          <h3>{index + 1}. {exercise.name}</h3>
                          <p className="muted">{exercise.instructions}</p>
                          {embedUrl && <div className="evaluation-video"><iframe src={embedUrl} title={`Vídeo: ${exercise.name}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>}
                          <div className="pain-scale" role="radiogroup" aria-label={`Dor em ${exercise.name}`}>{painScores.map((score) => <button className={answer?.pain === score ? 'pain-option selected' : 'pain-option'} key={score} type="button" aria-pressed={answer?.pain === score} onClick={() => updateAnswer(exercise.id, { pain: score as PainScore })}>{score}</button>)}</div>
                          {(exercisePainTypes.length > 0 || exercise.allowOtherPainDescription) && (
                            <fieldset className="toggle-field"><legend>Como foi a dor? (opcional)</legend>
                              <div className="chip-group">{exercisePainTypes.map((painType) => { const selected = (answer?.painTypeIds ?? []).includes(painType.id); return <button key={painType.id} type="button" className={selected ? 'chip selected' : 'chip'} aria-pressed={selected} onClick={() => togglePainType(exercise.id, painType.id)}>{painType.name}</button> })}</div>
                              {exercise.allowOtherPainDescription && <label className="pain-other">Outro<input placeholder="Descreva com suas palavras" value={answer?.other ?? ''} onChange={(event) => updateAnswer(exercise.id, { other: event.target.value })} /></label>}
                            </fieldset>
                          )}
                        </article>
                      )
                    })}
                  </div>
                </>
              )}
              <div className="step-actions"><button type="button" className="secondary" onClick={() => goToStep(1)}>Voltar</button><button type="button" disabled={!allAnswered || submitting} onClick={() => void submit()}>{submitting ? 'Analisando...' : 'Ver recomendações'}</button></div>
            </section>

            <section key={`assessment-step-${step}-result`} className={step === 3 ? 'card user-form-card assessment-step visible' : 'card user-form-card assessment-step'} aria-live="polite">
              {plan && (
                <>
                  <p className="eyebrow">Resultado da avaliação</p>
                  <h2>Maior dor {plan.painScore}/10 — nível {levelLabel}</h2>
                  {plan.groupSummary && (
                    <ul className="result-list">
                      {Object.entries(answers).filter(([id]) => battery.exercises.some((exercise) => exercise.id === id)).map(([id, answer]) => <li key={id}><span>{exerciseName(id)}</span><strong>{answer.pain}/10</strong></li>)}
                    </ul>
                  )}
                  {plan.requiresProfessionalGuidance && <div className="safety-alert">{plan.safetyMessage}</div>}
                  {plan.planName && <p className="plan-name">Plano indicado: <strong>{plan.planName}</strong></p>}
                  {!plan.requiresProfessionalGuidance && plan.recommendations.length === 0 && <p className="muted">Não encontramos exercícios ativos para o resultado desta avaliação.</p>}
                  {plan.recommendations.length > 0 && <div className="recommendation-list">{plan.recommendations.map(({ exercise, reason, rank }) => { const prescription = formatPrescription(exercise); return <article className="recommendation-item" key={exercise.id}><div><h3>{rank}. {exercise.name}</h3><p className="muted">{exercise.description}</p>{prescription.length > 0 && <p className="prescription">{prescription.join(' · ')}</p>}{exercise.equipment && <p className="muted">Equipamento: {exercise.equipment}</p>}<p>{reason}</p></div>{exercise.youtubeUrl && <a href={exercise.youtubeUrl} target="_blank" rel="noreferrer">Ver vídeo</a>}</article> })}</div>}
                </>
              )}
              <div className="step-actions"><button type="button" className="secondary" onClick={() => goToStep(2)}>Voltar</button><button type="button" onClick={restart}>Nova avaliação</button></div>
            </section>
          </>
        )}
      </div>
    </main>
  )
}
