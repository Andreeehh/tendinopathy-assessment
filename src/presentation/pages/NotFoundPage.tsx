import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <section className="card not-found" aria-labelledby="not-found-title">
      <p className="eyebrow">Erro 404</p>
      <h1 id="not-found-title">Página não encontrada</h1>
      <p className="muted">
        O endereço acessado não corresponde a uma área disponível no painel.
      </p>
      <Link className="button-link" to="/dashboard">
        Voltar ao dashboard
      </Link>
    </section>
  )
}
