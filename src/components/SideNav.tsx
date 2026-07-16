'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { tools } from '@/data/tools'
import { IconFolder, IconGear, IconHome, toolIcon } from '@/components/icons'

type NavItem = {
  href: string
  label: string
  icon: ReactNode
  match?: 'exact' | 'prefix'
}

const pageItems: NavItem[] = [
  {
    href: '/',
    label: '日誌',
    icon: <IconHome className="side-nav__svg" />,
    match: 'exact',
  },
  {
    href: '/tools',
    label: '工具總覽',
    icon: <IconFolder className="side-nav__svg" />,
    match: 'exact',
  },
  {
    href: '/about',
    label: '關於',
    icon: <IconGear className="side-nav__svg" />,
    match: 'prefix',
  },
]

function isActive(pathname: string, item: NavItem) {
  if (item.match === 'exact') {
    if (item.href === '/') return pathname === '/'
    return pathname === item.href || pathname === item.href.replace(/\/$/, '')
  }
  const base = item.href.replace(/\/$/, '')
  return pathname === item.href || pathname.startsWith(`${base}/`) || pathname === base
}

export function SideNav() {
  const pathname = usePathname()

  return (
    <aside className="side-nav" aria-label="側邊導覽">
      <Link href="/" className="side-nav__brand">
        <span className="side-nav__brand-mark" aria-hidden="true" />
        <span className="side-nav__brand-text">Mixing</span>
      </Link>

      <p className="side-nav__section">頁面</p>
      <nav className="side-nav__list">
        {pageItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={isActive(pathname, item) ? 'side-nav__link is-active' : 'side-nav__link'}
          >
            <span className="side-nav__icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <p className="side-nav__section">工具</p>
      <nav className="side-nav__list" aria-label="工具列表">
        {tools.map((tool) => {
          const href = `/tools/${tool.id}`
          const active = pathname === href || pathname.startsWith(`/tools/${tool.id}`)
          return (
            <Link key={tool.id} href={href} className={active ? 'side-nav__link is-active' : 'side-nav__link'}>
              <span className="side-nav__icon">{toolIcon(tool.icon, 'side-nav__svg')}</span>
              <span>{tool.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
