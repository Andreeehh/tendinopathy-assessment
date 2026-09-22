import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { anatomicalStructureRepository } from '@/infrastructure/repositories/anatomical-structures/InMemoryAnatomicalStructureRepository'
import { exerciseRepository } from '@/infrastructure/repositories/exercises/InMemoryExerciseRepository'

interface DashboardMetrics {
  structures: { total: number; active: number }
  exercises: { total: number; active: number; withVideo: number }
}

export function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadMetrics() {
      try {
        const [structures, exercises] = await Promise.all([
          anatomicalStructureRepository.list({ pageSize: 1000 }),
          exerciseRepository.list({ pageSize: 1000 }),
        ])
        setMetrics({
          structures: {
            total: structures.total,
            active: structures.items.filter((item) => item.active).length,
          },
          exercises: {
            total: exercises.total,
            active: exercises.items.filter((item) => item.active).length,
            withVideo: exercises.items.filter((item) => Boolean(item.youtubeUrl)).length,
          },
        })
      } catch {
        setError('Não foi possível carregar os indicadores do dashboard.')
      } finally {
        setLoading(false)
      }
    }

    void loadMetrics()
  }, [])

  return (
    <>
      <p className="eyebrow">Visão geral</p>
      <h1>Dashboard</h1>
      <p className="muted dashboard-intro">
        Acompanhe o conteúdo cadastrado na plataforma.
      </p>
      {error && <div className="alert" role="alert">{error}</div>}
      {loading ? (
        <section className="card"><p className="muted">Carregando indicadores...</p></section>
      ) : metrics ? (
        <>
          <section className="metric-grid" aria-label="Indicadores de conteúdo">
            <Link className="metric-card" to="/anatomical-structures">
              <span className="metric-label">Estruturas anatômicas</span>
              <strong>{metrics.structures.total}</strong>
              <span className="muted">{metrics.structures.active} ativas</span>
            </Link>
            <Link className="metric-card" to="/exercises">
              <span className="metric-label">Exercícios</span>
              <strong>{metrics.exercises.total}</strong>
              <span className="muted">{metrics.exercises.active} ativos</span>
            </Link>
            <Link className="metric-card" to="/exercises">
              <span className="metric-label">Exercícios com vídeo</span>
              <strong>{metrics.exercises.withVideo}</strong>
              <span className="muted">links do YouTube</span>
            </Link>
          </section>
          <section className="card dashboard-summary">
            <h2>Próximos passos</h2>
            <p className="muted">Use a navegação para revisar cadastros ou adicionar novos conteúdos.</p>
          </section>
        </>
      ) : null}
    </>
  )
}
