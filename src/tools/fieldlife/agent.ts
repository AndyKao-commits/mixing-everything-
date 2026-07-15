import type { ActionId, Observation, TrainStats } from './types'
import { FieldlifeSim } from './sim'

/** Heuristic “grind bot”: face prey, close in, attack, rest when hurt. */
export function grindPolicy(obs: Observation): ActionId {
  if (obs.hpRatio < 0.35) return 5
  if (obs.canAttack > 0.5) return 4

  // no nearby signal → wander forward with occasional turns
  if (obs.nearestDist >= 0.98) {
    if (Math.random() < 0.08) return Math.random() < 0.5 ? 2 : 3
    return 1
  }

  // face the nearest foe
  if (obs.nearestAngle > 0.12) return 2
  if (obs.nearestAngle < -0.12) return 3
  return 1
}

/** Random baseline for comparison. */
export function randomPolicy(_obs: Observation): ActionId {
  const r = Math.random()
  if (r < 0.45) return 1
  if (r < 0.6) return 2
  if (r < 0.75) return 3
  if (r < 0.9) return 4
  if (r < 0.97) return 5
  return 0
}

/**
 * Tiny linear preference over observation features.
 * Weights are nudged online with a REINFORCE-ish update (private sandbox toy).
 */
export class LinearAgent {
  weights: number[]
  lastObs: Observation | null = null
  lastAction: ActionId = 0
  learningRate: number

  constructor(learningRate = 0.08) {
    this.learningRate = learningRate
    // 6 actions × 10 features
    this.weights = Array.from({ length: 60 }, () => (Math.random() - 0.5) * 0.05)
  }

  private feats(obs: Observation): number[] {
    return [
      1,
      obs.hpRatio,
      obs.levelNorm,
      obs.yawSin,
      obs.yawCos,
      obs.canAttack,
      obs.nearestDist,
      obs.nearestAngle,
      obs.nearestHp,
      obs.nearbyCount,
    ]
  }

  private score(obs: Observation, action: ActionId): number {
    const f = this.feats(obs)
    let s = 0
    const base = action * f.length
    for (let i = 0; i < f.length; i++) s += this.weights[base + i]! * f[i]!
    return s
  }

  act(obs: Observation): ActionId {
    const scores = [0, 1, 2, 3, 4, 5].map((a) => this.score(obs, a as ActionId))
    const max = Math.max(...scores)
    const exps = scores.map((s) => Math.exp(s - max))
    const sum = exps.reduce((a, b) => a + b, 0)
    let r = Math.random() * sum
    let chosen: ActionId = 0
    for (let i = 0; i < exps.length; i++) {
      r -= exps[i]!
      if (r <= 0) {
        chosen = i as ActionId
        break
      }
    }
    this.lastObs = obs
    this.lastAction = chosen
    return chosen
  }

  /** Online update after receiving reward for last action. */
  learn(reward: number) {
    if (!this.lastObs) return
    const f = this.feats(this.lastObs)
    const base = this.lastAction * f.length
    for (let i = 0; i < f.length; i++) {
      this.weights[base + i]! += this.learningRate * reward * f[i]!
    }
  }
}

export type AgentMode = 'human' | 'grind' | 'random' | 'linear'

export function pickAction(mode: AgentMode, obs: Observation, linear: LinearAgent): ActionId {
  switch (mode) {
    case 'grind':
      return grindPolicy(obs)
    case 'random':
      return randomPolicy(obs)
    case 'linear':
      return linear.act(obs)
    default:
      return 0
  }
}

export function burstTrain(
  sim: FieldlifeSim,
  linear: LinearAgent,
  episodes: number,
): TrainStats[] {
  const log: TrainStats[] = []
  for (let e = 0; e < episodes; e++) {
    sim.reset()
    let reward = 0
    let steps = 0
    for (let i = 0; i < 1200; i++) {
      const obs = sim.observe()
      const action = linear.act(obs)
      const result = sim.step(action)
      linear.learn(result.reward)
      reward += result.reward
      steps += 1
      if (result.done) break
    }
    const snap = sim.getSnapshot()
    log.push({
      episode: snap.episode,
      steps,
      reward: Math.round(reward * 10) / 10,
      level: snap.hero.level,
      kills: snap.hero.kills,
      deaths: snap.hero.deaths,
      explored: snap.hero.explored,
    })
  }
  return log
}
