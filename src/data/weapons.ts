import type { EquipmentSlot, Rarity, WeaponEffectId } from '@/types/game'

export interface EquipmentDef {
  id: string
  name: string
  slot: EquipmentSlot
  baseAttack: number
  baseDefense: number
  baseCrit: number
  baseCritDamage: number
  minRarity: Rarity
  effectPool: WeaponEffectId[]
}

export const WEAPONS: EquipmentDef[] = [
  { id: 'rusty-blade', name: '銹鐵短劍', slot: 'weapon', baseAttack: 4, baseDefense: 0, baseCrit: 0.02, baseCritDamage: 0.1, minRarity: 'common', effectPool: ['bleed'] },
  { id: 'hunter-bow', name: '獵手短弓', slot: 'weapon', baseAttack: 5, baseDefense: 0, baseCrit: 0.04, baseCritDamage: 0.15, minRarity: 'uncommon', effectPool: ['doubleExp', 'bleed'] },
  { id: 'ember-axe', name: '餘燼戰斧', slot: 'weapon', baseAttack: 8, baseDefense: 0, baseCrit: 0.03, baseCritDamage: 0.2, minRarity: 'rare', effectPool: ['fire', 'doubleGold'] },
  { id: 'frostbite', name: '霜牙', slot: 'weapon', baseAttack: 9, baseDefense: 0, baseCrit: 0.05, baseCritDamage: 0.22, minRarity: 'epic', effectPool: ['freeze', 'chain'] },
  { id: 'shadowfang', name: '影牙', slot: 'weapon', baseAttack: 12, baseDefense: 0, baseCrit: 0.08, baseCritDamage: 0.35, minRarity: 'legendary', effectPool: ['lifesteal', 'poison', 'bleed'] },
  { id: 'stormcaller', name: '喚雷者', slot: 'weapon', baseAttack: 14, baseDefense: 0, baseCrit: 0.06, baseCritDamage: 0.4, minRarity: 'mythic', effectPool: ['chain', 'fire'] },
  { id: 'abyss-scythe', name: '深淵鐮刀', slot: 'weapon', baseAttack: 18, baseDefense: 0, baseCrit: 0.1, baseCritDamage: 0.5, minRarity: 'ancient', effectPool: ['lifesteal', 'poison', 'doubleGold'] },
  { id: 'divine-edge', name: '神裁之刃', slot: 'weapon', baseAttack: 24, baseDefense: 0, baseCrit: 0.12, baseCritDamage: 0.65, minRarity: 'divine', effectPool: ['chain', 'fire', 'doubleExp', 'lifesteal'] },
]

export const ARMORS: EquipmentDef[] = [
  { id: 'cloth-vest', name: '布背心', slot: 'armor', baseAttack: 0, baseDefense: 3, baseCrit: 0, baseCritDamage: 0, minRarity: 'common', effectPool: [] },
  { id: 'leather-mail', name: '皮甲', slot: 'armor', baseAttack: 1, baseDefense: 5, baseCrit: 0.01, baseCritDamage: 0, minRarity: 'uncommon', effectPool: ['lifesteal'] },
  { id: 'iron-plate', name: '鐵板甲', slot: 'armor', baseAttack: 0, baseDefense: 9, baseCrit: 0, baseCritDamage: 0, minRarity: 'rare', effectPool: [] },
  { id: 'crystal-guard', name: '晶盾護甲', slot: 'armor', baseAttack: 2, baseDefense: 12, baseCrit: 0.02, baseCritDamage: 0.05, minRarity: 'epic', effectPool: ['freeze'] },
  { id: 'dragon-scale', name: '龍鱗甲', slot: 'armor', baseAttack: 3, baseDefense: 16, baseCrit: 0.03, baseCritDamage: 0.1, minRarity: 'legendary', effectPool: ['fire'] },
  { id: 'void-carapace', name: '虛空甲殼', slot: 'armor', baseAttack: 4, baseDefense: 22, baseCrit: 0.04, baseCritDamage: 0.12, minRarity: 'mythic', effectPool: ['poison'] },
  { id: 'seraph-aegis', name: '熾天使聖甲', slot: 'armor', baseAttack: 5, baseDefense: 28, baseCrit: 0.05, baseCritDamage: 0.15, minRarity: 'ancient', effectPool: ['lifesteal', 'doubleExp'] },
  { id: 'godplate', name: '神性鎧', slot: 'armor', baseAttack: 8, baseDefense: 36, baseCrit: 0.06, baseCritDamage: 0.2, minRarity: 'divine', effectPool: ['chain', 'lifesteal'] },
]

export const RINGS: EquipmentDef[] = [
  { id: 'copper-ring', name: '銅戒', slot: 'ring', baseAttack: 1, baseDefense: 1, baseCrit: 0.02, baseCritDamage: 0.05, minRarity: 'common', effectPool: ['doubleGold'] },
  { id: 'blood-ring', name: '血戒', slot: 'ring', baseAttack: 3, baseDefense: 0, baseCrit: 0.04, baseCritDamage: 0.12, minRarity: 'rare', effectPool: ['lifesteal', 'bleed'] },
  { id: 'fortune-band', name: '幸運環', slot: 'ring', baseAttack: 2, baseDefense: 2, baseCrit: 0.03, baseCritDamage: 0.08, minRarity: 'epic', effectPool: ['doubleGold', 'doubleExp'] },
  { id: 'storm-signet', name: '嵐印', slot: 'ring', baseAttack: 5, baseDefense: 2, baseCrit: 0.06, baseCritDamage: 0.2, minRarity: 'legendary', effectPool: ['chain', 'fire'] },
]

export const AMULETS: EquipmentDef[] = [
  { id: 'wood-charm', name: '木護符', slot: 'amulet', baseAttack: 0, baseDefense: 2, baseCrit: 0.01, baseCritDamage: 0.05, minRarity: 'common', effectPool: [] },
  { id: 'hunter-totem', name: '獵手圖騰', slot: 'amulet', baseAttack: 2, baseDefense: 1, baseCrit: 0.03, baseCritDamage: 0.1, minRarity: 'rare', effectPool: ['doubleExp'] },
  { id: 'soul-prism', name: '魂晶', slot: 'amulet', baseAttack: 4, baseDefense: 3, baseCrit: 0.05, baseCritDamage: 0.18, minRarity: 'legendary', effectPool: ['lifesteal', 'poison'] },
  { id: 'divine-relic', name: '神性遺跡', slot: 'amulet', baseAttack: 7, baseDefense: 5, baseCrit: 0.08, baseCritDamage: 0.28, minRarity: 'divine', effectPool: ['chain', 'doubleGold', 'doubleExp'] },
]

export const ALL_EQUIPMENT_DEFS = [...WEAPONS, ...ARMORS, ...RINGS, ...AMULETS]

export const EFFECT_LABEL: Record<WeaponEffectId, string> = {
  fire: '火焰傷害',
  poison: '毒素',
  bleed: '流血',
  lifesteal: '生命偷取',
  chain: '連鎖閃電',
  freeze: '凍結',
  doubleGold: '雙倍金幣',
  doubleExp: '雙倍經驗',
}
