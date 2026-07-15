/** Discrete actions the agent (or player) can take each tick. */
export type ActionId = 0 | 1 | 2 | 3 | 4 | 5

export const ACTION_LABELS: Record<ActionId, string> = {
  0: '待機',
  1: '前進',
  2: '左轉',
  3: '右轉',
  4: '攻擊',
  5: '休息',
}

export type Vec3 = { x: number; y: number; z: number }

export type EntityKind = 'hero' | 'slime' | 'wolf' | 'crystal'

export type Entity = {
  id: number
  kind: EntityKind
  name: string
  x: number
  z: number
  yaw: number
  hp: number
  maxHp: number
  attack: number
  defense: number
  speed: number
  aggroRange: number
  attackRange: number
  level: number
  xp: number
  xpToNext: number
  kills: number
  deaths: number
  stepsAlive: number
  /** Cells visited — a crude “game life / exploration” footprint. */
  explored: number
  alive: boolean
  attackCooldown: number
  color: number
}

export type Obstacle = {
  x: number
  z: number
  halfW: number
  halfD: number
}

export type Observation = {
  hpRatio: number
  levelNorm: number
  yawSin: number
  yawCos: number
  canAttack: number
  nearestDist: number
  nearestAngle: number
  nearestHp: number
  nearbyCount: number
  exploreNorm: number
}

export type StepResult = {
  observation: Observation
  reward: number
  done: boolean
  info: {
    level: number
    kills: number
    deaths: number
    xp: number
    stepsAlive: number
    explored: number
    lastEvent: string
  }
}

export type SimSnapshot = {
  tick: number
  hero: Entity
  monsters: Entity[]
  obstacles: Obstacle[]
  worldSize: number
  lastEvent: string
  episode: number
  totalReward: number
}

export type TrainStats = {
  episode: number
  steps: number
  reward: number
  level: number
  kills: number
  deaths: number
  explored: number
}
