'use client'

import { PlayerViewContext } from '@/hooks/player-view-context'
import { usePlayerViewSource } from '@/hooks/usePlayerView'

export function PlayerViewProvider({ children }: { children: React.ReactNode }) {
  const value = usePlayerViewSource(2000)
  return <PlayerViewContext.Provider value={value}>{children}</PlayerViewContext.Provider>
}
