import { SHOP_OFFERS } from '@/data/items'
import { createEquipmentFromDef } from '@/systems/LootSystem'
import { ARMORS, WEAPONS, ALL_EQUIPMENT_DEFS } from '@/data/weapons'
import { spendGems, spendGold } from '@/systems/EconomySystem'
import type { Player } from '@/types/game'
import { pick, chance } from '@/utils/math'
import { rollRarity } from '@/data/rarity'

export function buyShopOffer(player: Player, offerId: string): Player | null {
  const offer = SHOP_OFFERS.find((entry) => entry.id === offerId)
  if (!offer) return null
  let next: Player | null = player
  if (offer.costGold) next = spendGold(player, offer.costGold)
  if (!next) return null
  if (offer.costGems) next = spendGems(next, offer.costGems)
  if (!next) return null

  switch (offer.kind) {
    case 'potion':
      return { ...next, potions: next.potions + 1 }
    case 'weapon':
      return { ...next, inventory: [...next.inventory, createEquipmentFromDef(pick(WEAPONS))].slice(0, 120) }
    case 'armor':
      return { ...next, inventory: [...next.inventory, createEquipmentFromDef(pick(ARMORS))].slice(0, 120) }
    case 'chest': {
      const rarity = rollRarity(0.35)
      return { ...next, inventory: [...next.inventory, createEquipmentFromDef(pick(ALL_EQUIPMENT_DEFS), rarity)].slice(0, 120) }
    }
    case 'randomBox': {
      if (chance(0.4)) return { ...next, gold: next.gold + 200 + Math.floor(Math.random() * 300) }
      if (chance(0.5)) return { ...next, gems: next.gems + 1 + Math.floor(Math.random() * 3) }
      return { ...next, inventory: [...next.inventory, createEquipmentFromDef(pick(ALL_EQUIPMENT_DEFS))].slice(0, 120) }
    }
    case 'legendaryBox': {
      const rarity = rollRarity(1.2)
      const forced = ['epic', 'legendary', 'mythic', 'ancient', 'divine'].includes(rarity)
        ? rarity
        : 'epic'
      return {
        ...next,
        inventory: [...next.inventory, createEquipmentFromDef(pick(ALL_EQUIPMENT_DEFS), forced as typeof rarity)].slice(0, 120),
      }
    }
    case 'skin':
      return {
        ...next,
        heroSkin: 'ember',
        achievements: next.achievements.includes('skin-ember')
          ? next.achievements
          : [...next.achievements, 'skin-ember'],
      }
    default:
      return next
  }
}
