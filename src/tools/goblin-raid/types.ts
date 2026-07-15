export type MonsterData = {
  id: string
  name: string
  nameZh: string
  hp: number
  armor: number
  attack: number
  cr: number
  xp: number
  color: string
  description: string
}

export type PlayerStats = {
  level: number
  hp: number
  maxHp: number
  strength: number
  vitality: number
  luck: number
  defense: number
  xp: number
  xpToNext: number
  kills: number
  gold: number
  herbs: number
}

export type DropId = 'gold' | 'herb' | 'blade' | 'charm' | 'bark'

export type DropItem = {
  id: DropId
  name: string
  description: string
}

export type LootResult = {
  drops: DropItem[]
  player: PlayerStats
  summary: string[]
}

export type GamePhase = 'boot' | 'explore' | 'combat' | 'loot' | 'defeat'

export type Dir = 'up' | 'down' | 'left' | 'right'

export type Vec = { x: number; y: number }
