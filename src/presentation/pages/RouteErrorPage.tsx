import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom'

export function RouteErrorPage() {
  const error = useRouteError()
  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : 'Ocorreu um erro inesperado ao carregar esta área.'

  return (
    <section className="card not-found" aria-labelledby="route-error-title">
      <p className="eyebrow">Erro</p>
      <h1 id="route-error-title">Não foi possível carregar a página</h1>
      <p className="muted">{message}</p>
      <Link className="button-link" to="/dashboard">
        Voltar ao dashboard
      </Link>
    </section>
  )
}
