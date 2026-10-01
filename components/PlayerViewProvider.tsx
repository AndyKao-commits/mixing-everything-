'use client'

import { PlayerViewContext } from '@/hooks/player-view-context'
import { usePlayerView } from '@/hooks/usePlayerView'

export function PlayerViewProvider({ children }: { children: React.ReactNode }) {
  const value = usePlayerView(2000)
  return <PlayerViewContext.Provider value={value}>{children}</PlayerViewContext.Provider>
}
