import type { UpgradeDef } from '@/types/game'

export const UPGRADES: UpgradeDef[] = [
  { id: 'attack', name: '鋒刃鍛造', description: '永久提升攻擊', baseCost: 25, costGrowth: 1.18, maxLevel: 200, perLevel: { attack: 1.2 } },
  { id: 'defense', name: '鐵壁鍛造', description: '永久提升防禦', baseCost: 25, costGrowth: 1.18, maxLevel: 200, perLevel: { defense: 1 } },
  { id: 'hp', name: '活力鍛造', description: '永久提升生命', baseCost: 30, costGrowth: 1.17, maxLevel: 200, perLevel: { maxHp: 8 } },
  { id: 'attackSpeed', name: '迅捷鍛造', description: '永久提升攻速', baseCost: 40, costGrowth: 1.22, maxLevel: 80, perLevel: { attackSpeed: 0.02 } },
  { id: 'crit', name: '破綻鍛造', description: '永久提升暴擊', baseCost: 45, costGrowth: 1.2, maxLevel: 100, perLevel: { critChance: 0.004, critDamage: 0.015 } },
  { id: 'gold', name: '商路鍛造', description: '永久提升金幣獲取', baseCost: 35, costGrowth: 1.19, maxLevel: 120, perLevel: { goldMultiplier: 0.04 } },
  { id: 'drop', name: '尋寶鍛造', description: '永久提升掉落率', baseCost: 50, costGrowth: 1.21, maxLevel: 80, perLevel: { dropMultiplier: 0.03 } },
  { id: 'exp', name: '悟性鍛造', description: '永久提升經驗獲取', baseCost: 35, costGrowth: 1.19, maxLevel: 120, perLevel: { expMultiplier: 0.04 } },
  { id: 'bossDamage', name: '屠魔鍛造', description: '永久提升對 Boss 傷害', baseCost: 60, costGrowth: 1.23, maxLevel: 80, perLevel: { bossDamageBonus: 0.03 } },
]
