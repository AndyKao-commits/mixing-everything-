import type { MonsterData, PlayerStats } from './types'

export function createPlayer(): PlayerStats {
  return {
    level: 1,
    hp: 24,
    maxHp: 24,
    attack: 6,
    xp: 0,
    xpToNext: 60,
    kills: 0,
  }
}

export function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function playerStrike(player: PlayerStats, monsterArmor: number): { hit: boolean; damage: number } {
  const toHit = roll(1, 20) + Math.floor(player.attack / 2)
  if (toHit < monsterArmor - 4) {
    return { hit: false, damage: 0 }
  }
  const damage = Math.max(1, roll(player.attack - 2, player.attack + 3))
  return { hit: true, damage }
}

export function monsterStrike(monster: MonsterData, playerArmor = 13): { hit: boolean; damage: number } {
  const toHit = roll(1, 20) + 3
  if (toHit < playerArmor) {
    return { hit: false, damage: 0 }
  }
  const damage = Math.max(1, roll(monster.attack - 2, monster.attack + 1))
  return { hit: true, damage }
}

export function applyXp(player: PlayerStats, gained: number): { player: PlayerStats; leveled: boolean } {
  let next = { ...player, xp: player.xp + gained, kills: player.kills + 1 }
  let leveled = false
  while (next.xp >= next.xpToNext) {
    next = {
      ...next,
      xp: next.xp - next.xpToNext,
      level: next.level + 1,
      maxHp: next.maxHp + 6,
      hp: next.maxHp + 6,
      attack: next.attack + 2,
      xpToNext: Math.round(next.xpToNext * 1.35),
    }
    leveled = true
  }
  return { player: next, leveled }
}

export function healPlayer(player: PlayerStats): PlayerStats {
  const amount = Math.max(6, Math.floor(player.maxHp * 0.35))
  return {
    ...player,
    hp: Math.min(player.maxHp, player.hp + amount),
  }
}
