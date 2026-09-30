'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const ITEMS = [
  { href: '/play', label: '首頁', icon: '🏠' },
  { href: '/play/tasks', label: '任務', icon: '🎯' },
  { href: '/play/games', label: '遊戲', icon: '🎮' },
  { href: '/play/me', label: '我的', icon: '👤' },
]

export function BottomNav() {
  const pathname = usePathname()
  return (
    <nav className="bottom-nav">
      <div className="bottom-nav-inner">
        {ITEMS.map((item) => {
          const active =
            item.href === '/play'
              ? pathname === '/play' || pathname === '/play/'
              : pathname?.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${active ? 'active' : ''}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
