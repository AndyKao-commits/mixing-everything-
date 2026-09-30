'use client'

import { PlayerAvatar } from '@/components/PlayerAvatar'
import type { Player } from '@/types/player'

export function PlayerList({ players }: { players: Player[] }) {
  return (
    <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
      {players.map((player, index) => (
        <div key={player.id} style={{ animationDelay: `${index * 60}ms` }}>
          <PlayerAvatar player={player} />
        </div>
      ))}
    </div>
  )
}
