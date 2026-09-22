import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import styles from './AdminLayout.module.css'

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <button
          type="button"
          className={styles.menuToggle}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
        </button>
        <span className={styles.topbarBrand}>Anatomia Admin</span>
      </header>
      <aside className={menuOpen ? `${styles.sidebar} ${styles.sidebarOpen}` : styles.sidebar}>
        <div className={styles.brand}>Anatomia Admin</div>
        <div className={styles.userName}>Administrador</div>
        <nav aria-label="Navegação principal">
          <NavLink className={styles.navLink} to="/dashboard" onClick={closeMenu}>
            Dashboard
          </NavLink>
          <NavLink className={styles.navLink} to="/anatomical-structures" onClick={closeMenu}>
            Estruturas anatômicas
          </NavLink>
          <NavLink className={styles.navLink} to="/exercises" onClick={closeMenu}>
            Exercícios
          </NavLink>
        </nav>
      </aside>
      {menuOpen && <button type="button" className={styles.overlay} aria-label="Fechar menu" onClick={closeMenu} />}
      <main className={styles.content}>
        <div className={styles.page}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
