import type { MonsterData } from './types'

const FALLBACK: MonsterData[] = [
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
    description: '軍紀嚴明的大地精斥候。',
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
    description: '帶著鏽鐵頭盔，吼聲比刀子還可怕。',
  },
]

const API_IDS = ['goblin', 'hobgoblin', 'bugbear'] as const

const ZH_NAMES: Record<string, string> = {
  goblin: '哥布林',
  hobgoblin: '大地精',
  bugbear: '熊地精',
}

const COLORS: Record<string, string> = {
  goblin: '#6f9b4c',
  hobgoblin: '#c45c26',
  bugbear: '#7a4d2c',
}

function armorValue(raw: unknown): number {
  if (typeof raw === 'number') return raw
  if (Array.isArray(raw) && raw[0] && typeof raw[0].value === 'number') {
    return raw[0].value
  }
  return 14
}

function attackFromActions(actions: Array<{ damage?: Array<{ damage_dice?: string }> }> | undefined): number {
  const dice = actions?.[0]?.damage?.[0]?.damage_dice
  if (!dice) return 5
  // Approximate average of NdM+K e.g. 1d6+2
  const match = /^(\d+)d(\d+)(?:\+(\d+))?$/.exec(dice)
  if (!match) return 5
  const n = Number(match[1])
  const m = Number(match[2])
  const bonus = Number(match[3] ?? 0)
  return Math.max(3, Math.round(n * ((m + 1) / 2) + bonus))
}

async function fetchOne(id: string): Promise<MonsterData | null> {
  const res = await fetch(`https://www.dnd5eapi.co/api/2014/monsters/${id}`)
  if (!res.ok) return null
  const data = (await res.json()) as {
    index: string
    name: string
    hit_points: number
    armor_class: unknown
    challenge_rating: number
    xp: number
    actions?: Array<{ damage?: Array<{ damage_dice?: string }> }>
    special_abilities?: Array<{ desc?: string }>
  }

  return {
    id: data.index,
    name: data.name,
    nameZh: ZH_NAMES[data.index] ?? data.name,
    hp: data.hit_points,
    armor: armorValue(data.armor_class),
    attack: attackFromActions(data.actions),
    cr: data.challenge_rating,
    xp: data.xp,
    color: COLORS[data.index] ?? '#6f9b4c',
    description: data.special_abilities?.[0]?.desc ?? '從霧林深處竄出的敵人。',
  }
}

export async function loadMonsterRoster(): Promise<{ monsters: MonsterData[]; source: 'api' | 'fallback' }> {
  try {
    const results = await Promise.all(API_IDS.map((id) => fetchOne(id)))
    const monsters = results.filter((m): m is MonsterData => m !== null)
    if (monsters.length === 0) {
      return { monsters: FALLBACK, source: 'fallback' }
    }
    // Keep local captain as mid boss spice
    return {
      monsters: [...monsters, FALLBACK[3]!],
      source: 'api',
    }
  } catch {
    return { monsters: FALLBACK, source: 'fallback' }
  }
}

export function pickMonster(roster: MonsterData[], playerLevel: number): MonsterData {
  const weighted = roster.flatMap((monster) => {
    const levelGap = playerLevel - 1
    const suitable = monster.cr <= 0.25 + levelGap * 0.35
    const weight = suitable ? 4 : monster.cr <= playerLevel ? 2 : 1
    return Array.from({ length: weight }, () => monster)
  })
  const pick = weighted[Math.floor(Math.random() * weighted.length)] ?? roster[0]!
  // Scale lightly with player level so waiting sessions stay tense
  const scale = 1 + Math.max(0, playerLevel - 1) * 0.12
  return {
    ...pick,
    hp: Math.round(pick.hp * scale),
    attack: Math.round(pick.attack * scale),
    xp: Math.round(pick.xp * (1 + (playerLevel - 1) * 0.08)),
  }
}

export { FALLBACK }
