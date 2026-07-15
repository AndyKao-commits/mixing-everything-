import { MAPS } from '@/data/maps'
import type { Player } from '@/types/game'
import { expCurve, goldCurve } from '@/utils/math'
import { calcPlayerDpsStats } from '@/systems/DamageSystem'
import { expToNext } from '@/utils/math'

export function grantKillRewards(
  player: Player,
  baseGold: number,
  baseExp: number,
  opts?: { doubleGold?: boolean; doubleExp?: boolean },
): Player {
  const stats = calcPlayerDpsStats(player)
  const diff = MAPS[player.currentMap].difficulty
  let gold = goldCurve(baseGold, player.currentWave, diff) * stats.goldMultiplier
  let exp = expCurve(baseExp, player.currentWave, diff) * stats.expMultiplier
  if (opts?.doubleGold) gold *= 2
  if (opts?.doubleExp) exp *= 2

  let next: Player = {
    ...player,
    gold: player.gold + Math.round(gold),
    exp: player.exp + Math.round(exp),
    kills: player.kills + 1,
  }

  while (next.exp >= expToNext(next.level)) {
    next = {
      ...next,
      exp: next.exp - expToNext(next.level),
      level: next.level + 1,
      skillPoints: next.skillPoints + 1,
      maxHp: next.maxHp + 10 + Math.floor(next.level / 5),
      hp: next.maxHp + 10 + Math.floor(next.level / 5),
      attack: next.attack + 1,
      defense: next.defense + (next.level % 2 === 0 ? 1 : 0),
    }
  }
  return next
}

export function spendGold(player: Player, amount: number): Player | null {
  if (player.gold < amount) return null
  return { ...player, gold: player.gold - amount }
}

export function spendGems(player: Player, amount: number): Player | null {
  if (player.gems < amount) return null
  return { ...player, gems: player.gems - amount }
}

export function calcOfflineGold(player: Player, elapsedMs: number) {
  const hours = Math.min(8, elapsedMs / 3_600_000)
  const stats = calcPlayerDpsStats(player)
  const perHour = 40 * player.currentWave * stats.goldMultiplier * MAPS[player.currentMap].difficulty
  return Math.floor(perHour * hours)
}
