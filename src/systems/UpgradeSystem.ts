import { UPGRADES } from '@/data/upgrades'
import type { Player, UpgradeId } from '@/types/game'
import { spendGold } from '@/systems/EconomySystem'

export function upgradeCost(id: UpgradeId, level: number) {
  const def = UPGRADES.find((entry) => entry.id === id)!
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, level))
}

export function buyUpgrade(player: Player, id: UpgradeId): Player | null {
  const def = UPGRADES.find((entry) => entry.id === id)
  if (!def) return null
  const level = player.upgrades[id] ?? 0
  if (level >= def.maxLevel) return null
  const cost = upgradeCost(id, level)
  const spent = spendGold(player, cost)
  if (!spent) return null
  return {
    ...spent,
    upgrades: { ...spent.upgrades, [id]: level + 1 },
  }
}

export function canBuyUpgrade(gold: number, id: UpgradeId, level: number) {
  return gold >= upgradeCost(id, level)
}
