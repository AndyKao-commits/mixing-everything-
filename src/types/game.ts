/** Goblin Raid Remastered — core types */

export type Rarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'mythic'
  | 'ancient'
  | 'divine'

export type MapId =
  | 'grassland'
  | 'forest'
  | 'cave'
  | 'snow'
  | 'volcano'
  | 'sky'
  | 'hell'
  | 'castle'

export type SkillClass = 'warrior' | 'tank' | 'assassin' | 'mage' | 'merchant' | 'explorer'

export type EquipmentSlot = 'weapon' | 'armor' | 'ring' | 'amulet'

export type WeaponEffectId =
  | 'fire'
  | 'poison'
  | 'bleed'
  | 'lifesteal'
  | 'chain'
  | 'freeze'
  | 'doubleGold'
  | 'doubleExp'

export type UpgradeId =
  | 'attack'
  | 'defense'
  | 'hp'
  | 'attackSpeed'
  | 'crit'
  | 'gold'
  | 'drop'
  | 'exp'
  | 'bossDamage'

export type QuestType = 'daily' | 'weekly' | 'story' | 'hidden'

export type FloatingColor = 'white' | 'yellow' | 'orange' | 'red' | 'green' | 'cyan'

export interface EquipmentItem {
  uid: string
  defId: string
  slot: EquipmentSlot
  name: string
  rarity: Rarity
  level: number
  attack: number
  defense: number
  critChance: number
  critDamage: number
  effect?: WeaponEffectId
  locked: boolean
  favorite: boolean
  sockets: number
  enchant: number
}

export interface InventoryStack {
  id: string
  qty: number
}

export interface Player {
  gold: number
  gems: number
  prestigeCoins: number
  level: number
  exp: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  critChance: number
  critDamage: number
  attackSpeed: number
  goldMultiplier: number
  dropMultiplier: number
  expMultiplier: number
  bossDamageBonus: number
  currentMap: MapId
  currentWave: number
  prestigeLevel: number
  skillPoints: number
  unlockedSkills: string[]
  skillClass: SkillClass
  equipment: Partial<Record<EquipmentSlot, EquipmentItem | null>>
  inventory: EquipmentItem[]
  materials: InventoryStack[]
  potions: number
  upgrades: Record<UpgradeId, number>
  achievements: string[]
  quests: QuestProgress[]
  playTime: number
  kills: number
  bossKills: number
  combo: number
  maxCombo: number
  autoBattle: boolean
  unlockedMaps: MapId[]
  settings: GameSettings
  heroSkin: string
  lastSaveAt: number
  createdAt: number
}

export interface GameSettings {
  sound: boolean
  music: boolean
  fps: 30 | 60
  graphicQuality: 'low' | 'medium' | 'high'
  damageNumbers: boolean
  autoSave: boolean
  language: 'zh' | 'en'
  darkMode: boolean
}

export interface MonsterAbility {
  id: string
  name: string
  description: string
  chance: number
  power: number
}

export interface Monster {
  id: string
  name: string
  nameZh: string
  hp: number
  attack: number
  defense: number
  speed: number
  goldDrop: number
  expDrop: number
  rarity: Rarity
  abilities: MonsterAbility[]
  sprite: string
  color: string
  mapIds: MapId[]
}

export interface BossDef extends Monster {
  phaseHpRatio: number
  rageHpRatio: number
  uniqueSkill: string
  chestRarity: Rarity
}

export interface Combatant {
  id: string
  name: string
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  isBoss: boolean
  phase: 1 | 2
  raging: boolean
  color: string
  sprite: string
  status: StatusEffect[]
  defId: string
  rarity: Rarity
}

export interface StatusEffect {
  id: WeaponEffectId | 'freeze' | 'poison' | 'bleed' | 'fire'
  remainingMs: number
  power: number
  tickEveryMs: number
  lastTickAt: number
}

export interface DamageResult {
  amount: number
  isCrit: boolean
  isPerfect: boolean
  isExecute: boolean
  isBackAttack: boolean
  color: FloatingColor
  label?: string
}

export interface FloatingText {
  id: string
  text: string
  color: FloatingColor
  x: number
  y: number
  createdAt: number
}

export interface QuestDef {
  id: string
  type: QuestType
  title: string
  description: string
  target: number
  metric: 'kills' | 'bossKills' | 'gold' | 'level' | 'waves' | 'crafts'
  rewards: { gold?: number; gems?: number; skillPoints?: number; item?: string }
}

export interface QuestProgress {
  id: string
  progress: number
  completed: boolean
  claimed: boolean
  resetsAt?: number
}

export interface AchievementDef {
  id: string
  title: string
  description: string
  metric: keyof Player | 'legendaryOwned' | 'mapsUnlocked' | 'playHours'
  target: number
  reward: { gold?: number; gems?: number; skillPoints?: number }
}

export interface SkillDef {
  id: string
  classId: SkillClass
  name: string
  description: string
  tier: number
  cost: number
  requires?: string[]
  effect: SkillEffect
}

export interface SkillEffect {
  attack?: number
  defense?: number
  maxHp?: number
  critChance?: number
  critDamage?: number
  attackSpeed?: number
  goldMultiplier?: number
  dropMultiplier?: number
  expMultiplier?: number
  bossDamageBonus?: number
  lifesteal?: number
}

export interface UpgradeDef {
  id: UpgradeId
  name: string
  description: string
  baseCost: number
  costGrowth: number
  maxLevel: number
  perLevel: SkillEffect
}

export interface MapDef {
  id: MapId
  name: string
  nameZh: string
  unlockWave: number
  unlockPrestige: number
  bgFrom: string
  bgTo: string
  accent: string
  musicKey: string
  monsterIds: string[]
  bossId: string
  difficulty: number
}

export interface ShopOffer {
  id: string
  name: string
  description: string
  kind: 'potion' | 'weapon' | 'armor' | 'chest' | 'randomBox' | 'legendaryBox' | 'skin'
  costGold?: number
  costGems?: number
}

export interface CombatFxEvent {
  id: string
  type: 'hit' | 'crit' | 'death' | 'boss' | 'levelup' | 'loot' | 'shake' | 'flash'
  at: number
}

export type PanelId =
  | 'battle'
  | 'inventory'
  | 'upgrade'
  | 'skills'
  | 'quest'
  | 'shop'
  | 'boss'
  | 'achievement'
  | 'settings'
  | 'forge'

export interface GameRuntime {
  enemy: Combatant | null
  playerAtkCd: number
  enemyAtkCd: number
  skillCd: Record<string, number>
  floating: FloatingText[]
  fx: CombatFxEvent[]
  lastFrameAt: number
  paused: boolean
  waveClearing: boolean
  offlineClaimed: boolean
}
