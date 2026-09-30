'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getPlayerToken } from '@/lib/client-session'

export default function LandingPage() {
  const [eventName, setEventName] = useState('今晚誰會贏？')
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    setHasSession(Boolean(getPlayerToken()))
    api.state().then((s) => setEventName(s.event?.name || '今晚誰會贏？')).catch(() => {})
  }, [])

  return (
    <main className="shell relative flex min-h-dvh flex-col justify-center py-10">
      <div className="animate-rise text-center">
        <p className="text-sm font-semibold tracking-[0.28em] text-soft">PARTY GAME</p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-tight text-ink">
          今晚誰會贏？
        </h1>
        <p className="mt-3 text-soft">{eventName}</p>
      </div>

      <div className="mt-12 space-y-3 animate-rise" style={{ animationDelay: '80ms' }}>
        <Link href={hasSession ? '/play' : '/join'} className="btn-primary">
          加入遊戲
        </Link>
        {hasSession ? (
          <Link href="/play" className="btn-secondary">
            回到我的遊戲
          </Link>
        ) : null}
      </div>

      <Link
        href="/admin"
        className="absolute bottom-6 right-4 text-xs font-medium text-soft/80 underline-offset-2 hover:underline"
      >
        管理員
      </Link>
    </main>
  )
}
