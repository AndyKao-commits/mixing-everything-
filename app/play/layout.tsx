'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { usePlayerView } from '@/hooks/usePlayerView'

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data } = usePlayerView(1000)

  useEffect(() => {
    if (!data?.event) return

    // Final phases must take over every player's screen at the same time.
    // Without this redirect, players sitting on Home/Tasks/My never see the
    // settlement countdown because that UI lives on /play/games.
    const forceGames =
      data.event.status === 'message' ||
      data.event.status === 'settlement' ||
      data.event.status === 'finished' ||
      (data.event.active_group_game && data.event.active_group_game !== 'none')

    if (forceGames && pathname !== '/play/games') router.replace('/play/games')
  }, [data?.event?.status, data?.event?.active_group_game, pathname, router])

  return (
    <div className="shell pb-24 pt-5">
      {children}
      <BottomNav />
    </div>
  )
}
