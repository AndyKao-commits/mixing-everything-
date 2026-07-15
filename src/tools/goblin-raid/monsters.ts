import type { MonsterData, MonsterShape, ZoneId } from './types'

type MonsterSeed = {
  id: string
  name: string
  nameZh: string
  hp: number
  armor: number
  attack: number
  cr: number
  xp: number
  color: string
  description: string
  shape: MonsterShape
  zones: ZoneId[]
}

/** 完整離線包——跟 API 載入失敗時用同一套品質，不依賴網路。 */
const OFFLINE_PACK: MonsterSeed[] = [
  {
    id: 'kobold',
    name: 'Kobold',
    nameZh: '狗頭人',
    hp: 5,
    armor: 12,
    attack: 4,
    cr: 0.125,
    xp: 25,
    color: '#c4a35a',
    description: '又矮又刺耳，專抄近路偷襲。',
    shape: 'humanoid',
    zones: ['mistwood', 'ruins'],
  },
  {
    id: 'giant-rat',
    name: 'Giant Rat',
    nameZh: '巨鼠',
    hp: 7,
    armor: 12,
    attack: 4,
    cr: 0.125,
    xp: 25,
    color: '#8a7460',
    description: '霧地裡竄出的肥鼠，牙尖嘴利。',
    shape: 'beast',
    zones: ['mistwood', 'marsh'],
  },
  {
    id: 'bandit',
    name: 'Bandit',
    nameZh: '盜匪',
    hp: 11,
    armor: 12,
    attack: 5,
    cr: 0.125,
    xp: 25,
    color: '#6b5b4a',
    description: '披著破斗篷的路匪，眼神發亮。',
    shape: 'humanoid',
    zones: ['ruins', 'mistwood'],
  },
  {
    id: 'stirge',
    name: 'Stirge',
    nameZh: '蚊蝠',
    hp: 2,
    armor: 14,
    attack: 5,
    cr: 0.125,
    xp: 25,
    color: '#8b3a4a',
    description: '嗡嗡作響的吸血小怪，很難打中。',
    shape: 'flyer',
    zones: ['marsh', 'mistwood'],
  },
  {
    id: 'goblin',
    name: 'Goblin',
    nameZh: '哥布林',
    hp: 7,
    armor: 15,
    attack: 5,
    cr: 0.25,
    xp: 50,
    color: '#6f9b4c',
    description: '又瘦又吵，彎刀亮亮的。',
    shape: 'humanoid',
    zones: ['mistwood', 'ruins'],
  },
  {
    id: 'wolf',
    name: 'Wolf',
    nameZh: '灰狼',
    hp: 11,
    armor: 13,
    attack: 6,
    cr: 0.25,
    xp: 50,
    color: '#7a8490',
    description: '林間灰影，一聲低吠後撲過來。',
    shape: 'beast',
    zones: ['mistwood', 'marsh'],
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    nameZh: '骷髏兵',
    hp: 13,
    armor: 13,
    attack: 5,
    cr: 0.25,
    xp: 50,
    color: '#c9d0d6',
    description: '骨架晃蕩，枯骨碰撞聲刺耳。',
    shape: 'undead',
    zones: ['ruins'],
  },
  {
    id: 'zombie',
    name: 'Zombie',
    nameZh: '殭屍',
    hp: 22,
    armor: 8,
    attack: 5,
    cr: 0.25,
    xp: 50,
    color: '#5f6e52',
    description: '動作遲緩，挨打卻格外耐揍。',
    shape: 'undead',
    zones: ['ruins', 'marsh'],
  },
  {
    id: 'hobgoblin',
    name: 'Hobgoblin',
    nameZh: '大地精',
    hp: 11,
    armor: 18,
    attack: 7,
    cr: 0.5,
    xp: 100,
    color: '#c45c26',
    description: '軍紀嚴明的斥候，盾牌很沉。',
    shape: 'humanoid',
    zones: ['mistwood', 'ruins'],
  },
  {
    id: 'orc',
    name: 'Orc',
    nameZh: '獸人',
    hp: 15,
    armor: 13,
    attack: 9,
    cr: 0.5,
    xp: 100,
    color: '#4a7a3a',
    description: '舉起巨斧就劈，力道兇狠。',
    shape: 'humanoid',
    zones: ['ruins', 'marsh'],
  },
  {
    id: 'gnoll',
    name: 'Gnoll',
    nameZh: '鬣狗人',
    hp: 22,
    armor: 15,
    attack: 6,
    cr: 0.5,
    xp: 100,
    color: '#b8893a',
    description: '狂笑的鬣狗人，嘴裡還掛著碎布。',
    shape: 'humanoid',
    zones: ['marsh', 'ruins'],
  },
  {
    id: 'bugbear',
    name: 'Bugbear',
    nameZh: '熊地精',
    hp: 27,
    armor: 16,
    attack: 10,
    cr: 1,
    xp: 200,
    color: '#7a4d2c',
    description: '又高又毛，喜歡從暗處撲過來。',
    shape: 'humanoid',
    zones: ['mistwood', 'ruins'],
  },
  {
    id: 'brown-bear',
    name: 'Brown Bear',
    nameZh: '棕熊',
    hp: 34,
    armor: 11,
    attack: 11,
    cr: 1,
    xp: 200,
    color: '#8b5a2b',
    description: '沼澤邊的大熊，爪子能撕開樹皮。',
    shape: 'beast',
    zones: ['marsh', 'mistwood'],
  },
  {
    id: 'harpy',
    name: 'Harpy',
    nameZh: '鷹身女妖',
    hp: 38,
    armor: 11,
    attack: 8,
    cr: 1,
    xp: 200,
    color: '#9a6ab0',
    description: '淒厲歌聲在霧裡迴盪，翅膀拍得狂亂。',
    shape: 'flyer',
    zones: ['marsh', 'ruins'],
  },
  {
    id: 'ogre',
    name: 'Ogre',
    nameZh: '食人魔',
    hp: 59,
    armor: 11,
    attack: 13,
    cr: 2,
    xp: 450,
    color: '#6a4f3a',
    description: '笨重巨漢，巨棒一揮就會斷枝。',
    shape: 'humanoid',
    zones: ['marsh', 'ruins'],
  },
  {
    id: 'goblin-raid-captain',
    name: 'Goblin Captain',
    nameZh: '哥布林隊長',
    hp: 18,
    armor: 16,
    attack: 8,
    cr: 1,
    xp: 150,
    color: '#4f7a3a',
    description: '戴鏽鐵頭盔，吼聲比刀子還可怕。',
    shape: 'humanoid',
    zones: ['mistwood', 'ruins'],
  },
]

const API_IDS = OFFLINE_PACK.filter((m) => m.id !== 'goblin-raid-captain').map((m) => m.id)

const BY_ID = Object.fromEntries(OFFLINE_PACK.map((m) => [m.id, m])) as Record<string, MonsterSeed>

function armorValue(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (Array.isArray(raw) && raw[0] && typeof raw[0].value === 'number') {
    return raw[0].value
  }
  return 14
}

function findDamageDice(actions: unknown): string | null {
  if (!Array.isArray(actions)) return null
  for (const action of actions) {
    if (!action || typeof action !== 'object') continue
    const damage = (action as { damage?: unknown }).damage
    if (!Array.isArray(damage)) continue
    for (const part of damage) {
      if (part && typeof part === 'object' && typeof (part as { damage_dice?: string }).damage_dice === 'string') {
        return (part as { damage_dice: string }).damage_dice
      }
    }
  }
  return null
}

function attackFromDice(dice: string | null, fallback: number): number {
  if (!dice) return fallback
  const match = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(dice)
  if (!match) return fallback
  const n = Number(match[1])
  const m = Number(match[2])
  const bonus = Number(match[3] ?? 0)
  return Math.max(3, Math.round(n * ((m + 1) / 2) + bonus))
}

function toMonster(seed: MonsterSeed, overrides: Partial<MonsterData> = {}): MonsterData {
  return {
    id: seed.id,
    name: seed.name,
    nameZh: seed.nameZh,
    hp: seed.hp,
    armor: seed.armor,
    attack: seed.attack,
    cr: seed.cr,
    xp: seed.xp,
    color: seed.color,
    description: seed.description,
    shape: seed.shape,
    zones: seed.zones,
    ...overrides,
  }
}

async function fetchOne(id: string): Promise<MonsterData | null> {
  const seed = BY_ID[id]
  if (!seed) return null
  const res = await fetch(`https://www.dnd5eapi.co/api/2014/monsters/${id}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null
  const data = (await res.json()) as {
    index: string
    name: string
    hit_points: number
    armor_class: unknown
    challenge_rating: number
    xp: number
    actions?: unknown
  }

  return toMonster(seed, {
    name: data.name,
    hp: data.hit_points,
    armor: armorValue(data.armor_class),
    attack: attackFromDice(findDamageDice(data.actions), seed.attack),
    cr: data.challenge_rating,
    xp: data.xp,
  })
}

export async function loadMonsterRoster(): Promise<{
  monsters: MonsterData[]
  source: 'api' | 'fallback'
  count: number
}> {
  try {
    const results = await Promise.all(API_IDS.map((id) => fetchOne(id)))
    const fromApi = results.filter((m): m is MonsterData => m !== null)
    if (fromApi.length < 8) {
      const pack = OFFLINE_PACK.map((seed) => toMonster(seed))
      return { monsters: pack, source: 'fallback', count: pack.length }
    }
    const captain = toMonster(BY_ID['goblin-raid-captain']!)
    const monsters = [...fromApi, captain]
    return { monsters, source: 'api', count: monsters.length }
  } catch {
    const pack = OFFLINE_PACK.map((seed) => toMonster(seed))
    return { monsters: pack, source: 'fallback', count: pack.length }
  }
}

export function pickMonster(
  roster: MonsterData[],
  playerLevel: number,
  zoneId: ZoneId = 'mistwood',
): MonsterData {
  const zonePool = roster.filter((monster) => monster.zones.includes(zoneId))
  const pool = zonePool.length > 0 ? zonePool : roster
  const maxCr = 0.125 + Math.max(0, playerLevel - 1) * 0.35 + (zoneId === 'marsh' ? 0.5 : zoneId === 'ruins' ? 0.25 : 0)

  const weighted = pool.flatMap((monster) => {
    let weight = 1
    if (monster.cr <= maxCr) weight = 5
    else if (monster.cr <= maxCr + 0.5) weight = 2
    if (monster.cr > playerLevel + 1.5) weight = 1
    return Array.from({ length: weight }, () => monster)
  })

  const pick = weighted[Math.floor(Math.random() * weighted.length)] ?? pool[0]!
  const scale = 1 + Math.max(0, playerLevel - 1) * 0.1
  return {
    ...pick,
    hp: Math.round(pick.hp * scale),
    attack: Math.round(pick.attack * scale),
    xp: Math.round(pick.xp * (1 + (playerLevel - 1) * 0.08)),
  }
}

export { OFFLINE_PACK }
