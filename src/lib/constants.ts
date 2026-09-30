export const AVATARS = ['🐷', '🐱', '🐶', '🦖', '🦊', '🐼', '🐯', '🐸', '🐵', '🦄', '🐙', '🐰'] as const

export const CATEGORY_META = {
  relationship: { label: '戀愛', icon: '💘' },
  lifestyle: { label: '生活', icon: '🏠' },
  money: { label: '金錢', icon: '💰' },
  social: { label: '社交', icon: '👥' },
  family: { label: '家庭', icon: '👨‍👩‍👦' },
  weird: { label: '荒謬', icon: '😂' },
  redflag: { label: '紅旗', icon: '🚩' },
  spicy: { label: '辛辣', icon: '🌶️' },
} as const

export const DEFAULT_CATEGORIES = [
  'relationship',
  'lifestyle',
  'money',
  'social',
  'weird',
] as const

export const SCORE_MIN = -5
export const SCORE_MAX = 15
export const SCORE_DEFAULT = 10

export const HOST_OFFLINE_MS = 30_000
export const ROOM_TTL_MS = 45 * 60_000
export const PLAYER_HEARTBEAT_MS = 8_000
export const POLL_INTERVAL_MS = 900
export const SPEED_MODE_SECONDS = 4

export function randomRoomCode(length = 4): string {
  let code = ''
  for (let i = 0; i < length; i += 1) {
    code += Math.floor(Math.random() * 10).toString()
  }
  return code
}

export function pickAvatar(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % AVATARS.length
  }
  return AVATARS[hash]
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}
