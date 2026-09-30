'use client'

import type { Player } from '@/types/player'

export function PlayerAvatar({
  player,
  size = 'md',
  highlight = false,
}: {
  player: Pick<Player, 'nickname' | 'avatar' | 'is_host'>
  size?: 'sm' | 'md' | 'lg'
  highlight?: boolean
}) {
  const sizeClass =
    size === 'lg' ? 'h-16 w-16 text-3xl' : size === 'sm' ? 'h-10 w-10 text-xl' : 'h-12 w-12 text-2xl'

  return (
    <div className={`flex flex-col items-center gap-1 ${highlight ? 'animate-bounceSoft' : ''}`}>
      <div
        className={`${sizeClass} relative flex items-center justify-center rounded-2xl bg-white/80 shadow-pop animate-pop-in`}
      >
        <span aria-hidden>{player.avatar}</span>
        {player.is_host ? (
          <span className="absolute -right-1 -top-2 text-lg" title="房主">
            👑
          </span>
        ) : null}
      </div>
      <span className="max-w-[4.5rem] truncate text-sm font-medium text-ink">{player.nickname}</span>
    </div>
  )
}
