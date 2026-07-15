import { ALL_EQUIPMENT_DEFS, EFFECT_LABEL } from '@/data/weapons'
import { rollRarity, RARITY_STAT_MULT, RARITY_ORDER } from '@/data/rarity'
import type { EquipmentItem, EquipmentSlot, Player, Rarity, WeaponEffectId } from '@/types/game'
import { chance, pick, uid } from '@/utils/math'
import type { EquipmentDef } from '@/data/weapons'

function rarityAtLeast(min: Rarity, rolled: Rarity): Rarity {
  const minIdx = RARITY_ORDER.indexOf(min)
  const rolledIdx = RARITY_ORDER.indexOf(rolled)
  return rolledIdx < minIdx ? min : rolled
}

export function createEquipmentFromDef(def: EquipmentDef, rarity?: Rarity, level = 0): EquipmentItem {
  const rolled = rarityAtLeast(def.minRarity, rarity ?? rollRarity())
  const mult = RARITY_STAT_MULT[rolled] * (1 + level * 0.08)
  const effect =
    def.effectPool.length > 0 && chance(0.45 + RARITY_ORDER.indexOf(rolled) * 0.06)
      ? pick(def.effectPool)
      : undefined

  return {
    uid: uid(def.slot),
    defId: def.id,
    slot: def.slot,
    name: def.name,
    rarity: rolled,
    level,
    attack: Math.round(def.baseAttack * mult),
    defense: Math.round(def.baseDefense * mult),
    critChance: def.baseCrit * (1 + RARITY_ORDER.indexOf(rolled) * 0.08),
    critDamage: def.baseCritDamage * (1 + RARITY_ORDER.indexOf(rolled) * 0.05),
    effect,
    locked: false,
    favorite: false,
    sockets: Math.min(3, Math.floor(RARITY_ORDER.indexOf(rolled) / 2)),
    enchant: 0,
  }
}

export function rollLootEquipment(player: Player, slot?: EquipmentSlot): EquipmentItem {
  const pool = slot
    ? ALL_EQUIPMENT_DEFS.filter((def) => def.slot === slot)
    : ALL_EQUIPMENT_DEFS
  const luck = Math.min(1.5, (player.dropMultiplier - 1) * 0.5 + player.level * 0.002)
  const rarity = rollRarity(luck)
  return createEquipmentFromDef(pick(pool), rarity)
}

export function describeEffect(effect?: WeaponEffectId) {
  return effect ? EFFECT_LABEL[effect] : '無'
}

export function sellValue(item: EquipmentItem) {
  const rarityIdx = RARITY_ORDER.indexOf(item.rarity)
  return Math.floor(12 + rarityIdx * 18 + item.level * 8 + item.attack * 2 + item.defense * 2)
}
