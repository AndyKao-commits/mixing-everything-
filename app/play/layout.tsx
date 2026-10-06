'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { BottomNav } from '@/components/BottomNav'
import { usePlayerView } from '@/hooks/usePlayerView'
import { PlayerViewProvider } from '@/components/PlayerViewProvider'
import { ConnectionBanner } from '@/components/ConnectionBanner'

function PlayLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data } = usePlayerView(2000)

  useEffect(() => {
    if (!data?.event) return

    // Final phases must take over every player's screen at the same time.
    // Without this redirect, players sitting on Home/Tasks/My never see the
    // settlement countdown because that UI lives on /play/games.
    const forceGames =
      data.event.status === 'message' ||
      data.event.status === 'settlement' ||
      (data.event.active_group_game && data.event.active_group_game !== 'none')

    if (forceGames && pathname !== '/play/games') router.replace('/play/games')
  }, [data?.event?.status, data?.event?.active_group_game, pathname, router])

  const immersive =
    data?.event?.status === 'message' ||
    data?.event?.status === 'settlement' ||
    (data?.event?.active_group_game && data.event.active_group_game !== 'none')

  return (
    <div className={immersive ? 'shell min-h-dvh py-5' : 'shell pb-24 pt-5'}>
      <ConnectionBanner />
      {children}
      {!immersive ? <BottomNav /> : null}
    </div>
  )
}

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <PlayerViewProvider><PlayLayoutInner>{children}</PlayLayoutInner></PlayerViewProvider>
}
