import type {
  ActionId,
  Entity,
  EntityKind,
  Observation,
  Obstacle,
  SimSnapshot,
  StepResult,
  StorySnapshot,
} from './types'
import {
  battleFlavor,
  birthLine,
  closingLines,
  collectNewMemories,
  getChapterById,
  judgeFate,
  omenLine,
  pickLifeName,
  resolveChapter,
  restFlavor,
  WORLD_LORE,
  type Atmosphere,
  type ChapterId,
  type ChronicleEntry,
  type LifeMetrics,
} from './story'

const WORLD_SIZE = 48
const EXPLORE_CELL = 2

type MonsterTemplate = {
  kind: EntityKind
  name: string
  maxHp: number
  attack: number
  defense: number
  speed: number
  aggroRange: number
  attackRange: number
  xpReward: number
  color: number
}

const TEMPLATES: MonsterTemplate[] = [
  {
    kind: 'slime',
    name: '碧苔（學會呼吸的雨）',
    maxHp: 18,
    attack: 3,
    defense: 0,
    speed: 0.055,
    aggroRange: 5,
    attackRange: 1.2,
    xpReward: 12,
    color: 0x4ecf7a,
  },
  {
    kind: 'wolf',
    name: '暮色狼（牧失落者）',
    maxHp: 28,
    attack: 6,
    defense: 1,
    speed: 0.09,
    aggroRange: 7,
    attackRange: 1.35,
    xpReward: 22,
    color: 0x7a8799,
  },
  {
    kind: 'crystal',
    name: '碎光晶靈（落下的天空）',
    maxHp: 40,
    attack: 8,
    defense: 2,
    speed: 0.07,
    aggroRange: 6,
    attackRange: 1.5,
    xpReward: 36,
    color: 0x6eb4ff,
  },
]

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function wrapAngle(a: number): number {
  let x = a
  while (x > Math.PI) x -= Math.PI * 2
  while (x < -Math.PI) x += Math.PI * 2
  return x
}

function dist(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx
  const dz = az - bz
  return Math.hypot(dx, dz)
}

function angleTo(fromX: number, fromZ: number, yaw: number, toX: number, toZ: number): number {
  const desired = Math.atan2(toX - fromX, toZ - fromZ)
  return wrapAngle(desired - yaw)
}

function collides(obstacles: Obstacle[], x: number, z: number, radius = 0.45): boolean {
  const half = WORLD_SIZE / 2 - 0.6
  if (Math.abs(x) > half || Math.abs(z) > half) return true
  for (const o of obstacles) {
    if (
      x + radius > o.x - o.halfW &&
      x - radius < o.x + o.halfW &&
      z + radius > o.z - o.halfD &&
      z - radius < o.z + o.halfD
    ) {
      return true
    }
  }
  return false
}

function xpNeeded(level: number): number {
  return Math.round(40 * Math.pow(1.32, level - 1))
}

function createHero(id: number, name: string): Entity {
  return {
    id,
    kind: 'hero',
    name,
    x: 0,
    z: 0,
    yaw: 0,
    hp: 40,
    maxHp: 40,
    attack: 7,
    defense: 2,
    speed: 0.14,
    aggroRange: 0,
    attackRange: 1.6,
    level: 1,
    xp: 0,
    xpToNext: xpNeeded(1),
    kills: 0,
    deaths: 0,
    stepsAlive: 0,
    explored: 1,
    alive: true,
    attackCooldown: 0,
    color: 0xf0c070,
  }
}

function createMonster(id: number, template: MonsterTemplate, x: number, z: number): Entity {
  return {
    id,
    kind: template.kind,
    name: template.name,
    x,
    z,
    yaw: Math.random() * Math.PI * 2,
    hp: template.maxHp,
    maxHp: template.maxHp,
    attack: template.attack,
    defense: template.defense,
    speed: template.speed,
    aggroRange: template.aggroRange,
    attackRange: template.attackRange,
    level: 1,
    xp: template.xpReward,
    xpToNext: 0,
    kills: 0,
    deaths: 0,
    stepsAlive: 0,
    explored: 0,
    alive: true,
    attackCooldown: 0,
    color: template.color,
  }
}

function buildObstacles(rng: () => number): Obstacle[] {
  const list: Obstacle[] = []
  for (let i = 0; i < 18; i++) {
    const x = (rng() - 0.5) * (WORLD_SIZE - 8)
    const z = (rng() - 0.5) * (WORLD_SIZE - 8)
    if (Math.hypot(x, z) < 4) continue
    list.push({
      x,
      z,
      halfW: 0.6 + rng() * 1.2,
      halfD: 0.6 + rng() * 1.2,
    })
  }
  return list
}

function spawnRing(count: number, nextId: () => number, rng: () => number): Entity[] {
  const monsters: Entity[] = []
  for (let i = 0; i < count; i++) {
    const t = TEMPLATES[i % TEMPLATES.length]!
    const angle = (i / count) * Math.PI * 2 + rng() * 0.4
    const radius = 8 + rng() * 12
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    monsters.push(createMonster(nextId(), t, x, z))
  }
  return monsters
}

export class FieldlifeSim {
  private tick = 0
  private episode = 0
  private totalReward = 0
  private lastEvent = '野原甦醒了。'
  private nextEntityId = 1
  private hero: Entity
  private monsters: Entity[] = []
  private obstacles: Obstacle[] = []
  private visited = new Set<string>()
  private seed: number

  private lifeName = '餘灰・無名'
  private chapterId: ChapterId = 'firstfall'
  private atmosphere: Atmosphere = getChapterById('firstfall').atmosphere
  private chronicle: ChronicleEntry[] = []
  private memoryIds = new Set<string>()
  private memories: string[] = []
  private rests = 0
  private slimeKills = 0
  private wolfKills = 0
  private crystalKills = 0
  private fateTitle: string | null = null
  private fateEpitaph: string | null = null
  private closed = false
  private lastOmenAt = 0

  constructor(seed = (Date.now() % 1_000_000) + 1) {
    this.seed = seed || 1
    this.hero = createHero(this.allocId(), this.lifeName)
    this.reset()
  }

  private allocId(): number {
    return this.nextEntityId++
  }

  private rng(): number {
    this.seed ^= this.seed << 13
    this.seed ^= this.seed >>> 17
    this.seed ^= this.seed << 5
    return ((this.seed >>> 0) % 10_000) / 10_000
  }

  private metrics(): LifeMetrics {
    return {
      level: this.hero.level,
      kills: this.hero.kills,
      explored: this.hero.explored,
      stepsAlive: this.hero.stepsAlive,
      rests: this.rests,
      slimeKills: this.slimeKills,
      wolfKills: this.wolfKills,
      crystalKills: this.crystalKills,
    }
  }

  private pushChronicle(kind: ChronicleEntry['kind'], text: string) {
    this.chronicle.unshift({ tick: this.tick, kind, text })
    if (this.chronicle.length > 40) this.chronicle.length = 40
    this.lastEvent = text
  }

  private syncStory(closing = false): number {
    let bonus = 0
    const m = this.metrics()
    const chapter = resolveChapter(m, closing || this.closed)
    if (chapter.id !== this.chapterId) {
      this.chapterId = chapter.id
      this.atmosphere = chapter.atmosphere
      this.pushChronicle('chapter', `篇章・${chapter.title}｜${chapter.unlockLine}`)
      bonus += 1.5 + chapter.index * 0.35
    }

    const unlocked = collectNewMemories(m, this.memoryIds)
    for (const mem of unlocked) {
      this.memories.unshift(mem.text)
      if (this.memories.length > 12) this.memories.length = 12
      this.pushChronicle('memory', mem.text)
      bonus += 1.2
    }
    return bonus
  }

  private storySnapshot(): StorySnapshot {
    const chapter = getChapterById(this.chapterId)
    return {
      lifeName: this.lifeName,
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      chapterSubtitle: chapter.subtitle,
      chapterIndex: chapter.index,
      chronicle: this.chronicle.map((c) => ({ ...c })),
      memories: [...this.memories],
      fateTitle: this.fateTitle,
      fateEpitaph: this.fateEpitaph,
      atmosphere: { ...this.atmosphere },
      loreTitle: WORLD_LORE.title,
    }
  }

  reset(): Observation {
    this.episode += 1
    this.tick = 0
    this.totalReward = 0
    this.visited = new Set(['0,0'])
    this.obstacles = buildObstacles(() => this.rng())
    this.lifeName = pickLifeName(this.episode)
    this.hero = createHero(this.allocId(), this.lifeName)
    this.monsters = spawnRing(10, () => this.allocId(), () => this.rng())
    this.chapterId = 'firstfall'
    this.atmosphere = getChapterById('firstfall').atmosphere
    this.chronicle = []
    this.memoryIds = new Set()
    this.memories = []
    this.rests = 0
    this.slimeKills = 0
    this.wolfKills = 0
    this.crystalKills = 0
    this.fateTitle = null
    this.fateEpitaph = null
    this.closed = false
    this.lastOmenAt = 0
    const birth = birthLine(this.episode, () => this.rng())
    this.pushChronicle('birth', `${this.lifeName}｜${birth}`)
    const ch = getChapterById('firstfall')
    this.pushChronicle('chapter', `篇章・${ch.title}｜${ch.unlockLine}`)
    return this.observe()
  }

  getSnapshot(): SimSnapshot {
    return {
      tick: this.tick,
      hero: { ...this.hero },
      monsters: this.monsters.map((m) => ({ ...m })),
      obstacles: this.obstacles.map((o) => ({ ...o })),
      worldSize: WORLD_SIZE,
      lastEvent: this.lastEvent,
      episode: this.episode,
      totalReward: this.totalReward,
      story: this.storySnapshot(),
    }
  }

  observe(): Observation {
    const h = this.hero
    const nearest = this.nearestAliveMonster()
    let nearestDist = 1
    let nearestAngle = 0
    let nearestHp = 0
    let nearbyCount = 0

    for (const m of this.monsters) {
      if (!m.alive) continue
      const d = dist(h.x, h.z, m.x, m.z)
      if (d < 10) nearbyCount += 1
    }

    if (nearest) {
      const d = dist(h.x, h.z, nearest.x, nearest.z)
      nearestDist = clamp(d / 20, 0, 1)
      nearestAngle = angleTo(h.x, h.z, h.yaw, nearest.x, nearest.z) / Math.PI
      nearestHp = nearest.hp / nearest.maxHp
    }

    return {
      hpRatio: h.hp / h.maxHp,
      levelNorm: clamp(h.level / 20, 0, 1),
      yawSin: Math.sin(h.yaw),
      yawCos: Math.cos(h.yaw),
      canAttack: nearest && dist(h.x, h.z, nearest.x, nearest.z) <= h.attackRange ? 1 : 0,
      nearestDist,
      nearestAngle,
      nearestHp,
      nearbyCount: clamp(nearbyCount / 8, 0, 1),
      exploreNorm: clamp(h.explored / 80, 0, 1),
      chapterNorm: clamp(getChapterById(this.chapterId).index / 9, 0, 1),
    }
  }

  private nearestAliveMonster(): Entity | null {
    let best: Entity | null = null
    let bestD = Infinity
    for (const m of this.monsters) {
      if (!m.alive) continue
      const d = dist(this.hero.x, this.hero.z, m.x, m.z)
      if (d < bestD) {
        bestD = d
        best = m
      }
    }
    return best
  }

  private markExplore(e: Entity) {
    const cx = Math.floor(e.x / EXPLORE_CELL)
    const cz = Math.floor(e.z / EXPLORE_CELL)
    const key = `${cx},${cz}`
    if (!this.visited.has(key)) {
      this.visited.add(key)
      e.explored += 1
      return 0.15
    }
    return 0
  }

  private tryMove(e: Entity, forward: number, strafe = 0): boolean {
    const dx = Math.sin(e.yaw) * forward + Math.cos(e.yaw) * strafe
    const dz = Math.cos(e.yaw) * forward - Math.sin(e.yaw) * strafe
    const nx = e.x + dx
    const nz = e.z + dz
    if (collides(this.obstacles, nx, nz)) return false
    e.x = nx
    e.z = nz
    return true
  }

  private applyHeroXp(amount: number): number {
    const h = this.hero
    h.xp += amount
    let levels = 0
    while (h.xp >= h.xpToNext) {
      h.xp -= h.xpToNext
      h.level += 1
      levels += 1
      h.maxHp += 6
      h.hp = h.maxHp
      h.attack += 1
      h.defense += levels % 2 === 0 ? 1 : 0
      h.xpToNext = xpNeeded(h.level)
    }
    return levels
  }

  private respawnMonster(m: Entity) {
    const angle = this.rng() * Math.PI * 2
    const radius = 10 + this.rng() * 12
    m.x = Math.cos(angle) * radius
    m.z = Math.sin(angle) * radius
    m.hp = m.maxHp
    m.alive = true
    m.attackCooldown = 20
    m.yaw = this.rng() * Math.PI * 2
  }

  private closeBook(): void {
    if (this.closed) return
    this.closed = true
    const fate = judgeFate(this.metrics())
    this.fateTitle = fate.title
    this.fateEpitaph = fate.epitaph
    this.syncStory(true)
    for (const line of closingLines(this.lifeName, fate, this.metrics())) {
      this.pushChronicle('epitaph', line)
    }
  }

  private updateMonsters(): number {
    let reward = 0
    const h = this.hero
    for (const m of this.monsters) {
      if (!m.alive) continue
      if (m.attackCooldown > 0) m.attackCooldown -= 1

      const d = dist(h.x, h.z, m.x, m.z)
      if (d < m.aggroRange && h.alive) {
        const ang = Math.atan2(h.x - m.x, h.z - m.z)
        m.yaw = ang
        if (d > m.attackRange * 0.85) {
          this.tryMove(m, m.speed)
        } else if (m.attackCooldown <= 0) {
          const dmg = Math.max(1, m.attack - h.defense)
          h.hp -= dmg
          m.attackCooldown = 18
          reward -= 0.35 * dmg
          this.lastEvent = `${m.name}咬住了這一世，-${dmg}`
          if (h.hp <= 0) {
            h.hp = 0
            h.alive = false
            h.deaths += 1
            reward -= 8
            this.closeBook()
          }
        }
      } else {
        if (this.rng() < 0.02) m.yaw += (this.rng() - 0.5) * 1.2
        this.tryMove(m, m.speed * 0.45)
      }
    }
    return reward
  }

  step(action: ActionId): StepResult {
    let reward = -0.01
    const h = this.hero

    if (!h.alive || this.closed) {
      return {
        observation: this.observe(),
        reward: 0,
        done: true,
        info: this.info(),
      }
    }

    this.tick += 1
    h.stepsAlive += 1
    if (h.attackCooldown > 0) h.attackCooldown -= 1

    switch (action) {
      case 0:
        reward -= 0.02
        break
      case 1: {
        const moved = this.tryMove(h, h.speed)
        reward += moved ? this.markExplore(h) : -0.05
        break
      }
      case 2:
        h.yaw = wrapAngle(h.yaw + 0.28)
        break
      case 3:
        h.yaw = wrapAngle(h.yaw - 0.28)
        break
      case 4: {
        const target = this.nearestAliveMonster()
        if (!target || dist(h.x, h.z, target.x, target.z) > h.attackRange) {
          reward -= 0.08
          this.lastEvent = '刀鋒劃過空風，冊頁留白。'
        } else if (h.attackCooldown > 0) {
          reward -= 0.03
        } else {
          const dmg = Math.max(1, h.attack - target.defense + Math.floor(this.rng() * 3))
          target.hp -= dmg
          h.attackCooldown = 12
          reward += 0.4 + dmg * 0.12
          if (target.hp <= 0) {
            target.alive = false
            target.hp = 0
            h.kills += 1
            if (target.kind === 'slime') this.slimeKills += 1
            if (target.kind === 'wolf') this.wolfKills += 1
            if (target.kind === 'crystal') this.crystalKills += 1
            const levels = this.applyHeroXp(target.xp)
            reward += 3 + target.xp * 0.05 + levels * 6
            this.pushChronicle(
              'battle',
              battleFlavor(target.name, true, levels > 0, h.level),
            )
            this.respawnMonster(target)
          } else {
            this.lastEvent = battleFlavor(target.name, false, false, h.level)
          }
        }
        break
      }
      case 5: {
        this.rests += 1
        if (h.hp >= h.maxHp) {
          reward -= 0.05
          this.lastEvent = restFlavor(0, true)
        } else {
          const heal = 2 + Math.floor(h.level / 3)
          h.hp = Math.min(h.maxHp, h.hp + heal)
          reward += 0.08
          if (this.rests === 1 || this.rests % 4 === 0) {
            this.pushChronicle('rest', restFlavor(heal, false))
          } else {
            this.lastEvent = restFlavor(heal, false)
          }
        }
        break
      }
    }

    reward += this.updateMonsters()
    reward += this.syncStory(false)

    if (
      h.alive &&
      this.tick - this.lastOmenAt > 220 &&
      this.rng() < 0.012
    ) {
      this.lastOmenAt = this.tick
      this.pushChronicle('omen', omenLine(() => this.rng()))
      reward += 0.25
    }

    const aliveCount = this.monsters.filter((m) => m.alive).length
    if (aliveCount < 6) {
      const t = TEMPLATES[Math.floor(this.rng() * TEMPLATES.length)]!
      const angle = this.rng() * Math.PI * 2
      const radius = 12 + this.rng() * 10
      this.monsters.push(
        createMonster(this.allocId(), t, Math.cos(angle) * radius, Math.sin(angle) * radius),
      )
    }

    this.totalReward += reward
    if (h.alive && h.stepsAlive >= 4000) {
      this.closeBook()
    }
    const done = !h.alive || this.closed

    return {
      observation: this.observe(),
      reward,
      done,
      info: this.info(),
    }
  }

  private info() {
    return {
      level: this.hero.level,
      kills: this.hero.kills,
      deaths: this.hero.deaths,
      xp: this.hero.xp,
      stepsAlive: this.hero.stepsAlive,
      explored: this.hero.explored,
      lastEvent: this.lastEvent,
      lifeName: this.lifeName,
      chapterTitle: getChapterById(this.chapterId).title,
      fateTitle: this.fateTitle,
    }
  }

  runEpisode(policy: (obs: Observation) => ActionId, maxSteps = 1500): {
    reward: number
    steps: number
    level: number
    kills: number
    explored: number
  } {
    this.reset()
    let total = 0
    let steps = 0
    for (let i = 0; i < maxSteps; i++) {
      const result = this.step(policy(this.observe()))
      total += result.reward
      steps += 1
      if (result.done) break
    }
    return {
      reward: total,
      steps,
      level: this.hero.level,
      kills: this.hero.kills,
      explored: this.hero.explored,
    }
  }
}

export { WORLD_SIZE }
