import { getBoss } from '@/data/monsters'
import { MAPS } from '@/data/maps'
import type { BossDef, Combatant, Player } from '@/types/game'
import { createEquipmentFromDef } from '@/systems/LootSystem'
import { ALL_EQUIPMENT_DEFS } from '@/data/weapons'
import { pick } from '@/utils/math'

export function getCurrentBossDef(player: Player): BossDef | undefined {
  return getBoss(MAPS[player.currentMap].bossId)
}

export function updateBossPhases(enemy: Combatant): Combatant {
  if (!enemy.isBoss) return enemy
  const ratio = enemy.hp / enemy.maxHp
  let next = { ...enemy }
  if (ratio <= 0.5 && next.phase === 1) {
    next = { ...next, phase: 2, attack: Math.round(next.attack * 1.25), speed: next.speed * 1.15 }
  }
  if (ratio <= 0.25 && !next.raging) {
    next = { ...next, raging: true, attack: Math.round(next.attack * 1.35), speed: next.speed * 1.2 }
  }
  return next
}

export function openBossChest(player: Player): Player {
  const boss = getCurrentBossDef(player)
  const rarity = boss?.chestRarity ?? 'rare'
  const item = createEquipmentFromDef(pick(ALL_EQUIPMENT_DEFS), rarity, Math.floor(player.currentWave / 20))
  return {
    ...player,
    inventory: [...player.inventory, item].slice(0, 120),
    gold: player.gold + Math.round(80 * MAPS[player.currentMap].difficulty),
    gems: player.gems + 1 + Math.floor(player.currentWave / 50),
  }
}
