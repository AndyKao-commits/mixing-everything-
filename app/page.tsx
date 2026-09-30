'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ensurePlayerId, getLastRoom } from '@/lib/player-storage'

export default function HomePage() {
  const [lastRoom, setLastRoom] = useState<string | null>(null)

  useEffect(() => {
    ensurePlayerId()
    setLastRoom(getLastRoom())
  }, [])

  return (
    <main className="page-shell flex min-h-dvh flex-col justify-center gap-10 py-10">
      <div className="text-center animate-slide-up">
        <p className="text-sm font-medium tracking-[0.28em] text-soft">PARTY ROOM</p>
        <h1 className="mt-4 font-display text-5xl font-bold leading-tight text-ink sm:text-6xl">
          今晚玩什麼？
        </h1>
        <p className="mt-4 text-base text-soft">不用登入，輸入代號直接玩</p>
      </div>

      <div className="space-y-3 animate-slide-up" style={{ animationDelay: '80ms' }}>
        <Link href="/create" className="btn-primary w-full">
          建立房間
        </Link>
        <Link href="/join" className="btn-secondary w-full min-h-14 text-lg">
          加入房間
        </Link>
      </div>

      {lastRoom ? (
        <Link
          href={`/room/${lastRoom}`}
          className="text-center text-sm font-medium text-coral underline-offset-4 hover:underline"
        >
          回到上一個房間 {lastRoom}
        </Link>
      ) : null}
    </main>
  )
}
