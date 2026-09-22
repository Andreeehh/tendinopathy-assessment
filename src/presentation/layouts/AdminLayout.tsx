import { NavLink, Outlet } from 'react-router-dom'
import styles from './AdminLayout.module.css'

export function AdminLayout() {
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>Anatomia Admin</div>
        <nav aria-label="Navegação principal">
          <NavLink className={styles.navLink} to="/dashboard">
            Dashboard
          </NavLink>
          <NavLink className={styles.navLink} to="/anatomical-structures">
            Estruturas anatômicas
          </NavLink>
          <NavLink className={styles.navLink} to="/exercises">
            Exercícios
          </NavLink>
        </nav>
      </aside>
      <main className={styles.content}>
        <header className={styles.header}>
          <span>Administração</span>
          <strong>Administrador</strong>
        </header>
        <div className={styles.page}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
