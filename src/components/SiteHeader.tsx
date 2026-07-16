'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: '首頁' },
  { href: '/tools/', label: '工具' },
  { href: '/about/', label: '關於' },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="site-header">
      <Link href="/" className="site-logo">
        <span className="site-logo__mark" aria-hidden="true" />
        Mixing Everything
      </Link>
      <nav className="site-nav" aria-label="主要導覽">
        {links.map((link) => {
          const active =
            link.href === '/'
              ? pathname === '/'
              : pathname === link.href || pathname.startsWith(link.href.replace(/\/$/, ''))
          return (
            <Link key={link.href} href={link.href} className={active ? 'site-nav__link is-active' : 'site-nav__link'}>
              {link.label}
            </Link>
          )
        })}
      </nav>
      <Link href="/tools/" className="btn btn--primary site-header__cta">
        開始探索
      </Link>
    </header>
  )
}
