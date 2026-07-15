import { NavLink, Outlet } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'site-nav__link is-active' : 'site-nav__link'

export function Layout() {
  return (
    <div className="site-shell">
      <div className="site-atmosphere" aria-hidden="true" />
      <header className="site-header">
        <NavLink to="/" className="site-logo">
          Mixing
        </NavLink>
        <nav className="site-nav" aria-label="主要導覽">
          <NavLink to="/" end className={navLinkClass}>
            首頁
          </NavLink>
          <NavLink to="/tools" className={navLinkClass}>
            工具
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            關於
          </NavLink>
        </nav>
      </header>
      <main className="site-main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Mixing Everything — 小東西慢慢累積的地方</p>
      </footer>
    </div>
  )
}
