import type { GameMeta } from '@/types/game'

export const ENABLED_GAMES: GameMeta[] = [
  {
    id: 'perfect_man',
    name: '滿分男',
    description: '他是10分男，但是……',
    icon: '💘',
    min_players: 3,
    enabled: true,
  },
]

export const UPCOMING_GAMES: Array<{
  name: string
  description: string
  icon: string
  min_players: number
  enabled: boolean
}> = [
  { name: '真心話', description: '即將推出', icon: '🗣️', min_players: 3, enabled: false },
  { name: '誰最可能', description: '即將推出', icon: '👀', min_players: 3, enabled: false },
  { name: '二選一', description: '即將推出', icon: '⚖️', min_players: 3, enabled: false },
  { name: '朋友默契', description: '即將推出', icon: '🤝', min_players: 3, enabled: false },
  { name: '地獄選擇', description: '即將推出', icon: '😈', min_players: 3, enabled: false },
  { name: '匿名爆料', description: '即將推出', icon: '🕵️', min_players: 3, enabled: false },
]
