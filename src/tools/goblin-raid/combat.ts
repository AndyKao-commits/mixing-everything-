import type { DropId, DropItem, LootResult, MonsterData, PlayerStats } from './types'

export function createPlayer(): PlayerStats {
  return {
    level: 1,
    hp: 28,
    maxHp: 28,
    strength: 6,
    vitality: 5,
    luck: 4,
    defense: 3,
    xp: 0,
    xpToNext: 60,
    kills: 0,
    gold: 0,
    herbs: 1,
  }
}

export function roll(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function playerStrike(
  player: PlayerStats,
  monsterArmor: number,
): { hit: boolean; damage: number; crit: boolean } {
  const toHit = roll(1, 20) + Math.floor(player.strength / 2) + Math.floor(player.luck / 4)
  if (toHit < monsterArmor - 4) {
    return { hit: false, damage: 0, crit: false }
  }
  const crit = roll(1, 100) <= 8 + player.luck * 2
  const base = roll(player.strength - 1, player.strength + 3)
  const damage = Math.max(1, crit ? Math.round(base * 1.6) : base)
  return { hit: true, damage, crit }
}

export function monsterStrike(
  monster: MonsterData,
  player: PlayerStats,
): { hit: boolean; damage: number } {
  const toHit = roll(1, 20) + 3
  const playerArmor = 11 + player.defense
  if (toHit < playerArmor) {
    return { hit: false, damage: 0 }
  }
  const raw = roll(monster.attack - 2, monster.attack + 1)
  const damage = Math.max(1, raw - Math.floor(player.defense / 3))
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
      vitality: next.vitality + 1,
      strength: next.strength + 1,
      maxHp: next.maxHp + 5 + Math.floor(next.vitality / 2),
      hp: next.maxHp + 5 + Math.floor(next.vitality / 2),
      xpToNext: Math.round(next.xpToNext * 1.35),
    }
    // Every odd level also gain luck or defense
    if (next.level % 2 === 0) next = { ...next, luck: next.luck + 1 }
    else next = { ...next, defense: next.defense + 1 }
    leveled = true
  }
  return { player: next, leveled }
}

export function healPlayer(player: PlayerStats, fromHerb = false): PlayerStats {
  if (fromHerb && player.herbs <= 0) return player
  const amount = Math.max(7, Math.floor(player.maxHp * 0.32) + Math.floor(player.vitality / 2))
  return {
    ...player,
    herbs: fromHerb ? player.herbs - 1 : player.herbs,
    hp: Math.min(player.maxHp, player.hp + amount),
  }
}

export function fleeChance(player: PlayerStats): number {
  return Math.min(85, 45 + player.luck * 4)
}

const DROP_TABLE: Array<{ id: DropId; name: string; description: string; weight: number }> = [
  { id: 'gold', name: '金幣', description: '+金幣', weight: 10 },
  { id: 'herb', name: '草藥', description: '戰鬥可消耗療傷', weight: 6 },
  { id: 'blade', name: '銹鐵刀', description: '力量 +1', weight: 3 },
  { id: 'charm', name: '幸運符', description: '幸運 +1', weight: 3 },
  { id: 'bark', name: '樹皮甲片', description: '防禦 +1', weight: 3 },
]

function pickDrop(player: PlayerStats): DropItem {
  const bonus = Math.floor(player.luck / 2)
  const bag = DROP_TABLE.flatMap((entry) => {
    const w = entry.weight + (entry.id === 'blade' || entry.id === 'charm' ? bonus : 0)
    return Array.from({ length: w }, () => entry)
  })
  const chosen = bag[roll(0, bag.length - 1)] ?? DROP_TABLE[0]!
  return {
    id: chosen.id,
    name: chosen.name,
    description: chosen.description,
  }
}

export function rollLoot(player: PlayerStats, monster: MonsterData): LootResult {
  const dropCount = 1 + (roll(1, 100) <= 20 + player.luck * 3 ? 1 : 0)
  const drops: DropItem[] = []
  let next = { ...player }
  const summary: string[] = []

  for (let i = 0; i < dropCount; i += 1) {
    const drop = pickDrop(next)
    drops.push(drop)
    if (drop.id === 'gold') {
      const amount = roll(3, 8) + Math.round(monster.cr * 4)
      next = { ...next, gold: next.gold + amount }
      summary.push(`金幣 +${amount}`)
    } else if (drop.id === 'herb') {
      next = { ...next, herbs: next.herbs + 1 }
      summary.push('草藥 +1')
    } else if (drop.id === 'blade') {
      next = { ...next, strength: next.strength + 1 }
      summary.push('力量 +1')
    } else if (drop.id === 'charm') {
      next = { ...next, luck: next.luck + 1 }
      summary.push('幸運 +1')
    } else if (drop.id === 'bark') {
      next = { ...next, defense: next.defense + 1 }
      summary.push('防禦 +1')
    }
  }

  return { drops, player: next, summary }
}
