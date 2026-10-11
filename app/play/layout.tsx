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

    if (data.event.entry_locked && !data.testAccess) {
      router.replace('/')
      return
    }

    // Final phases take over every player's screen, but once the 10-second
    // settlement reveal is over, players may revisit /play/tasks to save their bingo.
    const settlementRevealDone =
      data.event.status === 'settlement' &&
      Boolean(data.event.settlement_started_at) &&
      Date.now() - new Date(data.event.settlement_started_at).getTime() >= 10_000
    const postSettlementBingo = pathname === '/play/tasks' && settlementRevealDone
    const forceGames =
      data.event.status === 'message' ||
      (data.event.status === 'settlement' && !postSettlementBingo) ||
      (data.event.active_group_game && data.event.active_group_game !== 'none')

    if (forceGames && pathname !== '/play/games') router.replace('/play/games')
  }, [data?.event?.status, data?.event?.active_group_game, data?.event?.entry_locked, data?.event?.settlement_started_at, data?.testAccess, pathname, router])

  const settlementRevealDone =
    data?.event?.status === 'settlement' &&
    Boolean(data.event.settlement_started_at) &&
    Date.now() - new Date(data.event.settlement_started_at).getTime() >= 10_000
  const postSettlementBingo = pathname === '/play/tasks' && settlementRevealDone
  const immersive =
    data?.event?.status === 'message' ||
    (data?.event?.status === 'settlement' && !postSettlementBingo) ||
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
