import type { GameSettings, Player, UpgradeId } from '@/types/game'
import { expToNext } from '@/utils/math'

const UPGRADE_IDS: UpgradeId[] = [
  'attack',
  'defense',
  'hp',
  'attackSpeed',
  'crit',
  'gold',
  'drop',
  'exp',
  'bossDamage',
]

export function defaultSettings(): GameSettings {
  return {
    sound: true,
    music: true,
    fps: 60,
    graphicQuality: 'high',
    damageNumbers: true,
    autoSave: true,
    language: 'zh',
    darkMode: true,
  }
}

export function createPlayer(): Player {
  const upgrades = Object.fromEntries(UPGRADE_IDS.map((id) => [id, 0])) as Record<UpgradeId, number>
  const now = Date.now()
  return {
    gold: 0,
    gems: 0,
    prestigeCoins: 0,
    level: 1,
    exp: 0,
    hp: 120,
    maxHp: 120,
    attack: 8,
    defense: 3,
    critChance: 0.08,
    critDamage: 1.5,
    attackSpeed: 1,
    goldMultiplier: 1,
    dropMultiplier: 1,
    expMultiplier: 1,
    bossDamageBonus: 0,
    currentMap: 'grassland',
    currentWave: 1,
    prestigeLevel: 0,
    skillPoints: 1,
    unlockedSkills: [],
    skillClass: 'warrior',
    equipment: { weapon: null, armor: null, ring: null, amulet: null },
    inventory: [],
    materials: [
      { id: 'scrap', qty: 0 },
      { id: 'essence', qty: 0 },
      { id: 'core', qty: 0 },
      { id: 'scroll', qty: 0 },
    ],
    potions: 2,
    upgrades,
    achievements: [],
    quests: [],
    playTime: 0,
    kills: 0,
    bossKills: 0,
    combo: 0,
    maxCombo: 0,
    autoBattle: true,
    unlockedMaps: ['grassland'],
    settings: defaultSettings(),
    lastSaveAt: now,
    createdAt: now,
  }
}

export function xpNeeded(player: Player) {
  return expToNext(player.level)
}
