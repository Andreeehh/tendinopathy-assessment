import { useEffect, useMemo, useState } from 'react'
import type { AnatomicalStructure } from '@/domain/anatomical-structures'
import type { PainScore } from '@/domain/pain-assessment'
import type { AnatomicalMapPlacement } from '@/domain/common/types'
import type { Exercise } from '@/domain/exercises'
import { getYoutubeEmbedUrl } from '@/domain/exercises'
import { createRecommendationPlan } from '@/domain/recommendations'
import { anatomicalStructureRepository } from '@/infrastructure/repositories/anatomical-structures/InMemoryAnatomicalStructureRepository'
import { exerciseRepository } from '@/infrastructure/repositories/exercises/InMemoryExerciseRepository'
import { painAssessmentRepository } from '@/infrastructure/repositories/pain-assessment/InMemoryPainAssessmentRepository'
import { BodyPainMap } from '@/presentation/components/BodyPainMap'

const painScores = Array.from({ length: 11 }, (_, score) => score)

export function UserAssessmentPage() {
  const [structures, setStructures] = useState<AnatomicalStructure[]>([])
  const [structureId, setStructureId] = useState('')
  const [side, setSide] = useState<'left' | 'right' | 'both' | 'not-applicable'>('not-applicable')
  const [face, setFace] = useState<'anterior' | 'posterior'>('anterior')
  const [placement, setPlacement] = useState<AnatomicalMapPlacement | undefined>()
  const [painScore, setPainScore] = useState<PainScore | ''>('')
  const [evaluationExerciseId, setEvaluationExerciseId] = useState('')
  const [evaluationExercises, setEvaluationExercises] = useState<Exercise[]>([])
  const [therapeuticExercises, setTherapeuticExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<ReturnType<typeof createRecommendationPlan> | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  useEffect(() => {
    Promise.all([
      anatomicalStructureRepository.list({ active: true, pageSize: 100 }),
      exerciseRepository.list({ active: true, pageSize: 100 }),
    ])
      .then(([structureResult, exerciseResult]) => {
        console.info('[Assessment] estruturas retornadas', {
          total: structureResult.total,
          items: structureResult.items.map((structure) => ({
            id: structure.id,
            name: structure.name,
            mapPlacements: structure.mapPlacements,
          })),
        })
        setStructures(structureResult.items)
        setEvaluationExercises(exerciseResult.items.filter((exercise) => exercise.kind === 'evaluation'))
        setTherapeuticExercises(exerciseResult.items.filter((exercise) => exercise.kind === 'therapeutic'))
      })
      .catch(() => setError('Não foi possível carregar as áreas disponíveis.'))
      .finally(() => setLoading(false))
  }, [])

  const selectedStructure = structures.find((structure) => structure.id === structureId)
  const availableEvaluationExercises = useMemo(
    () => evaluationExercises.filter((exercise) =>
      exercise.anatomicalStructureId === structureId,
    ),
    [evaluationExercises, structureId],
  )

  function goToStep(nextStep: 1 | 2 | 3) {
    if (nextStep < 3) setPlan(null)
    setStep(nextStep)
  }

  function selectStructure(structure: string, selectedPlacement: AnatomicalMapPlacement) {
    console.info('[Assessment] posição selecionada', {
      structureId: structure,
      placement: selectedPlacement,
    })
    setStructureId(structure)
    setEvaluationExerciseId('')
    setPlacement(undefined)
    setPlacement(selectedPlacement)
    setSide(selectedPlacement.side)
    setFace(selectedPlacement.face)
    goToStep(2)
  }

  async function submit() {
    setError(null)
    if (!selectedStructure || painScore === '') {
      setError('Selecione uma estrutura anatômica e informe o nível da dor.')
      return
    }
    if (!evaluationExerciseId) {
      setError('Selecione um exercício avaliativo antes de informar o nível da dor.')
      return
    }
    setSubmitting(true)
    try {
      const session = await painAssessmentRepository.createSession({
        userId: 'demo-user',
        painArea: {
          anatomicalStructureId: structureId || undefined,
          side: side === 'not-applicable' ? undefined : side,
          face,
        },
        initialPainScore: painScore,
      })
      setPlan(createRecommendationPlan({
        painScore,
        painArea: session.painArea,
        exercises: therapeuticExercises,
        sessionId: session.id,
      }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a avaliação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="user-shell">
      <div className="user-content">
        <p className="eyebrow">Avaliação inicial</p>
        <h1>Encontre exercícios para sua dor</h1>
        <p className="muted">Informe onde dói e a intensidade atual para receber uma orientação inicial.</p>
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
            <section key={`assessment-step-${step}-evaluation`} className={step === 2 ? 'card user-form-card assessment-step visible' : 'card user-form-card assessment-step'}>
              <h2>2. Faça um exercício avaliativo</h2>
              <p className="muted">Escolha o movimento indicado para a área selecionada e faça-o apenas dentro do seu limite confortável.</p>
              {availableEvaluationExercises.length === 0 ? <p className="muted empty-state">Nenhum exercício avaliativo disponível para essa área.</p> : <div className="evaluation-list">{availableEvaluationExercises.map((exercise) => { const embedUrl = exercise.youtubeUrl ? getYoutubeEmbedUrl(exercise.youtubeUrl) : null; return <article className={evaluationExerciseId === exercise.id ? 'evaluation-option selected' : 'evaluation-option'} key={exercise.id}><label><input type="radio" name="evaluation-exercise" value={exercise.id} checked={evaluationExerciseId === exercise.id} onChange={() => setEvaluationExerciseId(exercise.id)} /><span><strong>{exercise.name}</strong><small>{exercise.instructions}</small></span></label>{embedUrl && <div className="evaluation-video"><iframe src={embedUrl} title={`Vídeo: ${exercise.name}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>}</article> })}</div>}
              <div className="step-actions"><button type="button" className="secondary" onClick={() => goToStep(1)}>Voltar</button><button type="button" disabled={!evaluationExerciseId} onClick={() => goToStep(3)}>Avançar</button></div>
            </section>
            <section key={`assessment-step-${step}-pain`} className={step === 3 ? 'card user-form-card assessment-step visible' : 'card user-form-card assessment-step'}>
              <h2>3. Qual foi o nível da dor durante o exercício?</h2>
              <p className="muted">0 significa nenhuma dor e 10 significa a pior dor imaginável.</p>
              <div className="pain-scale" role="radiogroup" aria-label="Nível da dor">{painScores.map((score) => <button className={painScore === score ? 'pain-option selected' : 'pain-option'} key={score} type="button" aria-pressed={painScore === score} onClick={() => setPainScore(score as PainScore)}>{score}</button>)}</div>
              <button type="button" disabled={submitting || loading} onClick={() => void submit()}>{submitting ? 'Analisando...' : 'Ver recomendações'}</button>
              <div className="step-actions"><button type="button" className="secondary" onClick={() => goToStep(2)}>Voltar</button><span /></div>
            </section>
          </>
        )}
        {plan && step === 3 && (
          <section className="card recommendation-card" aria-live="polite">
            <p className="eyebrow">Resultado da avaliação</p>
            <h2>Dor {plan.painScore}/10 — nível {plan.painLevel === 'low' ? 'baixo' : plan.painLevel === 'moderate' ? 'moderado' : 'alto'}</h2>
            {plan.requiresProfessionalGuidance && <div className="safety-alert">{plan.safetyMessage}</div>}
            {!plan.requiresProfessionalGuidance && plan.recommendations.length === 0 && <p className="muted">Não encontramos exercícios ativos para essa combinação de área e estrutura.</p>}
            {plan.recommendations.length > 0 && <div className="recommendation-list">{plan.recommendations.map(({ exercise, reason }) => <article className="recommendation-item" key={exercise.id}><div><h3>{exercise.name}</h3><p className="muted">{exercise.description}</p><p>{reason}</p></div>{exercise.youtubeUrl && <a href={exercise.youtubeUrl} target="_blank" rel="noreferrer">Ver vídeo</a>}</article>)}</div>}
          </section>
        )}
      </div>
    </main>
  )
}
