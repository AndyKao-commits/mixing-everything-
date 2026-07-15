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
  attack: number
  xp: number
  xpToNext: number
  kills: number
}

export type GamePhase = 'boot' | 'explore' | 'combat' | 'loot' | 'defeat'

export type Dir = 'up' | 'down' | 'left' | 'right'

export type CombatLog = string

export type Vec = { x: number; y: number }
