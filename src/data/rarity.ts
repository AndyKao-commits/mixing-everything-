import type { Rarity } from '@/types/game'

export const RARITY_ORDER: Rarity[] = [
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'mythic',
  'ancient',
  'divine',
]

export const RARITY_LABEL: Record<Rarity, string> = {
  common: '普通',
  uncommon: '優秀',
  rare: '稀有',
  epic: '史詩',
  legendary: '傳說',
  mythic: '神話',
  ancient: '遠古',
  divine: '神聖',
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#b8c4bc',
  uncommon: '#5bd67a',
  rare: '#5b8dff',
  epic: '#b26bff',
  legendary: '#ffb347',
  mythic: '#ff5ec4',
  ancient: '#5ef0d0',
  divine: '#ffe566',
}

export const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 42,
  uncommon: 28,
  rare: 16,
  epic: 8,
  legendary: 3.5,
  mythic: 1.5,
  ancient: 0.7,
  divine: 0.3,
}

export const RARITY_STAT_MULT: Record<Rarity, number> = {
  common: 1,
  uncommon: 1.15,
  rare: 1.35,
  epic: 1.6,
  legendary: 2,
  mythic: 2.5,
  ancient: 3.2,
  divine: 4.2,
}

export function rollRarity(luckBonus = 0): Rarity {
  const boost = 1 + luckBonus
  const weighted = RARITY_ORDER.flatMap((rarity) => {
    const w = Math.max(0.05, RARITY_WEIGHT[rarity] * (rarity === 'common' ? 1 / boost : boost))
    return Array.from({ length: Math.max(1, Math.round(w * 10)) }, () => rarity)
  })
  return weighted[Math.floor(Math.random() * weighted.length)] ?? 'common'
}
