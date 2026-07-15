import type { EquipmentItem, Player } from '@/types/game'
import { sellValue } from '@/systems/LootSystem'
import { trackQuest } from '@/systems/QuestSystem'
import { chance } from '@/utils/math'

export function equipItem(player: Player, uid: string): Player {
  const item = player.inventory.find((entry) => entry.uid === uid)
  if (!item) return player
  const previous = player.equipment[item.slot] ?? null
  const inventory = player.inventory.filter((entry) => entry.uid !== uid)
  if (previous) inventory.push(previous)
  return {
    ...player,
    inventory,
    equipment: { ...player.equipment, [item.slot]: item },
  }
}

export function unequipItem(player: Player, slot: EquipmentItem['slot']): Player {
  const item = player.equipment[slot]
  if (!item) return player
  return {
    ...player,
    equipment: { ...player.equipment, [slot]: null },
    inventory: [...player.inventory, item].slice(0, 120),
  }
}

export function sellItem(player: Player, uid: string): Player {
  const item = player.inventory.find((entry) => entry.uid === uid)
  if (!item || item.locked) return player
  return {
    ...player,
    gold: player.gold + sellValue(item),
    inventory: player.inventory.filter((entry) => entry.uid !== uid),
  }
}

export function toggleLock(player: Player, uid: string): Player {
  return {
    ...player,
    inventory: player.inventory.map((item) =>
      item.uid === uid ? { ...item, locked: !item.locked } : item,
    ),
  }
}

export function toggleFavorite(player: Player, uid: string): Player {
  return {
    ...player,
    inventory: player.inventory.map((item) =>
      item.uid === uid ? { ...item, favorite: !item.favorite } : item,
    ),
  }
}

export function upgradeItem(player: Player, uid: string): Player | null {
  const item = player.inventory.find((entry) => entry.uid === uid) ?? Object.values(player.equipment).find((e) => e?.uid === uid)
  if (!item) return null
  const scrap = player.materials.find((m) => m.id === 'scrap')?.qty ?? 0
  const cost = 3 + item.level * 2
  if (scrap < cost) return null
  const patched: EquipmentItem = {
    ...item,
    level: item.level + 1,
    attack: item.attack + 1 + Math.floor(item.level / 3),
    defense: item.defense + (item.slot === 'armor' ? 1 : 0),
  }
  let next: Player = {
    ...player,
    materials: player.materials.map((m) => (m.id === 'scrap' ? { ...m, qty: m.qty - cost } : m)),
  }
  next = trackQuest(next, 'crafts', 1)
  if (next.equipment[item.slot]?.uid === uid) {
    return { ...next, equipment: { ...next.equipment, [item.slot]: patched } }
  }
  return {
    ...next,
    inventory: next.inventory.map((entry) => (entry.uid === uid ? patched : entry)),
  }
}

export function enchantItem(player: Player, uid: string): Player | null {
  const scrolls = player.materials.find((m) => m.id === 'scroll')?.qty ?? 0
  if (scrolls < 1) return null
  const apply = (item: EquipmentItem): EquipmentItem => ({
    ...item,
    enchant: item.enchant + 1,
    critChance: item.critChance + 0.005,
    critDamage: item.critDamage + 0.02,
  })
  let next: Player = {
    ...player,
    materials: player.materials.map((m) => (m.id === 'scroll' ? { ...m, qty: m.qty - 1 } : m)),
  }
  next = trackQuest(next, 'crafts', 1)
  if (next.equipment.weapon?.uid === uid || next.equipment.armor?.uid === uid || next.equipment.ring?.uid === uid || next.equipment.amulet?.uid === uid) {
    const slot = (['weapon', 'armor', 'ring', 'amulet'] as const).find((s) => next.equipment[s]?.uid === uid)!
    return { ...next, equipment: { ...next.equipment, [slot]: apply(next.equipment[slot]!) } }
  }
  return {
    ...next,
    inventory: next.inventory.map((item) => (item.uid === uid ? apply(item) : item)),
  }
}

export function reforgeItem(player: Player, uid: string): Player | null {
  const essence = player.materials.find((m) => m.id === 'essence')?.qty ?? 0
  if (essence < 2) return null
  const bump = chance(0.5) ? 1 : -1
  const apply = (item: EquipmentItem): EquipmentItem => ({
    ...item,
    attack: Math.max(0, item.attack + bump),
    defense: Math.max(0, item.defense + (bump > 0 ? 0 : 0)),
  })
  let next: Player = {
    ...player,
    materials: player.materials.map((m) => (m.id === 'essence' ? { ...m, qty: m.qty - 2 } : m)),
  }
  next = trackQuest(next, 'crafts', 1)
  return {
    ...next,
    inventory: next.inventory.map((item) => (item.uid === uid ? apply(item) : item)),
  }
}
