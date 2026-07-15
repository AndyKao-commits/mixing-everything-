import type {
  DropId,
  DropItem,
  InventoryItem,
  LootResult,
  MonsterData,
  PlayerStats,
  StatKey,
} from './types'

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
    freePoints: 0,
    bag: [],
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

export function applyXp(
  player: PlayerStats,
  gained: number,
): { player: PlayerStats; leveled: boolean; pointsGained: number } {
  let next = { ...player, xp: player.xp + gained, kills: player.kills + 1 }
  let leveled = false
  let pointsGained = 0
  while (next.xp >= next.xpToNext) {
    const gain = 3
    next = {
      ...next,
      xp: next.xp - next.xpToNext,
      level: next.level + 1,
      freePoints: next.freePoints + gain,
      maxHp: next.maxHp + 4 + Math.floor(next.vitality / 3),
      hp: next.maxHp + 4 + Math.floor(next.vitality / 3),
      xpToNext: Math.round(next.xpToNext * 1.35),
    }
    pointsGained += gain
    leveled = true
  }
  return { player: next, leveled, pointsGained }
}

export function allocatePoint(player: PlayerStats, stat: StatKey): PlayerStats {
  if (player.freePoints <= 0) return player
  const next = { ...player, freePoints: player.freePoints - 1, [stat]: player[stat] + 1 }
  if (stat === 'vitality') {
    next.maxHp += 3
    next.hp = Math.min(next.maxHp, player.hp + 3)
  }
  return next
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

const DROP_META: Record<
  DropId,
  { name: string; description: string; weight: number; stat?: StatKey }
> = {
  gold: { name: '金幣', description: '通用貨幣', weight: 10 },
  herb: { name: '草藥', description: '戰鬥可消耗療傷', weight: 6 },
  blade: { name: '銹鐵刀', description: '使用後力量 +1', weight: 3, stat: 'strength' },
  charm: { name: '幸運符', description: '使用後幸運 +1', weight: 3, stat: 'luck' },
  bark: { name: '樹皮甲片', description: '使用後防禦 +1', weight: 3, stat: 'defense' },
}

function pickDropId(player: PlayerStats): DropId {
  const entries = (Object.keys(DROP_META) as DropId[]).flatMap((id) => {
    const meta = DROP_META[id]
    const bonus = id === 'blade' || id === 'charm' || id === 'bark' ? Math.floor(player.luck / 2) : 0
    return Array.from({ length: meta.weight + bonus }, () => id)
  })
  return entries[roll(0, entries.length - 1)] ?? 'gold'
}

let itemSeq = 0

function makeBagItem(id: 'blade' | 'charm' | 'bark'): InventoryItem {
  itemSeq += 1
  const meta = DROP_META[id]
  return {
    uid: `${id}-${itemSeq}-${Date.now()}`,
    id,
    name: meta.name,
    description: meta.description,
    stat: meta.stat!,
  }
}

export function applyBagItem(player: PlayerStats, uid: string): PlayerStats {
  const item = player.bag.find((entry) => entry.uid === uid)
  if (!item) return player
  const next: PlayerStats = {
    ...player,
    bag: player.bag.filter((entry) => entry.uid !== uid),
    [item.stat]: player[item.stat] + 1,
  }
  return next
}

export function rollLoot(player: PlayerStats, monster: MonsterData): LootResult {
  const dropCount = 1 + (roll(1, 100) <= 20 + player.luck * 3 ? 1 : 0)
  const drops: DropItem[] = []
  let next: PlayerStats = { ...player, bag: [...player.bag] }
  const summary: string[] = []

  for (let i = 0; i < dropCount; i += 1) {
    const id = pickDropId(next)
    const meta = DROP_META[id]
    drops.push({ id, name: meta.name, description: meta.description })

    if (id === 'gold') {
      const amount = roll(3, 8) + Math.round(monster.cr * 4)
      next = { ...next, gold: next.gold + amount }
      summary.push(`金幣 +${amount}`)
    } else if (id === 'herb') {
      next = { ...next, herbs: next.herbs + 1 }
      summary.push('草藥 +1（背包）')
    } else {
      const item = makeBagItem(id)
      next = { ...next, bag: [...next.bag, item] }
      summary.push(`${item.name}（可在角色頁使用）`)
    }
  }

  return { drops, player: next, summary }
}

export const STAT_LABELS: Record<StatKey, string> = {
  strength: '力量',
  vitality: '體質',
  luck: '幸運',
  defense: '防禦',
}
