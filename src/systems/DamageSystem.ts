import { UPGRADES } from '@/data/upgrades'
import { SKILLS } from '@/data/skills'
import type { Player } from '@/types/game'
import { clamp } from '@/utils/math'

export function calcPlayerDpsStats(player: Player) {
  let attack = player.attack
  let defense = player.defense
  let maxHp = player.maxHp
  let critChance = player.critChance
  let critDamage = player.critDamage
  let attackSpeed = player.attackSpeed
  let goldMultiplier = player.goldMultiplier
  let dropMultiplier = player.dropMultiplier
  let expMultiplier = player.expMultiplier
  let bossDamageBonus = player.bossDamageBonus
  let lifesteal = 0

  for (const def of UPGRADES) {
    const level = player.upgrades[def.id] ?? 0
    if (!level) continue
    const e = def.perLevel
    attack += (e.attack ?? 0) * level
    defense += (e.defense ?? 0) * level
    maxHp += (e.maxHp ?? 0) * level
    attackSpeed += (e.attackSpeed ?? 0) * level
    critChance += (e.critChance ?? 0) * level
    critDamage += (e.critDamage ?? 0) * level
    goldMultiplier += (e.goldMultiplier ?? 0) * level
    dropMultiplier += (e.dropMultiplier ?? 0) * level
    expMultiplier += (e.expMultiplier ?? 0) * level
    bossDamageBonus += (e.bossDamageBonus ?? 0) * level
  }

  for (const skill of SKILLS) {
    if (!player.unlockedSkills.includes(skill.id)) continue
    lifesteal += skill.effect.lifesteal ?? 0
  }

  for (const item of Object.values(player.equipment)) {
    if (!item) continue
    attack += item.attack + item.enchant * 0.8
    defense += item.defense + item.enchant * 0.5
    critChance += item.critChance
    critDamage += item.critDamage
    if (item.effect === 'lifesteal') lifesteal += 0.04 + item.level * 0.005
  }

  const prestigeMul = 1 + player.prestigeLevel * 0.08
  attack *= prestigeMul
  defense *= prestigeMul
  maxHp *= prestigeMul
  goldMultiplier += player.prestigeLevel * 0.05
  dropMultiplier += player.prestigeLevel * 0.03
  expMultiplier += player.prestigeLevel * 0.03

  return {
    attack: Math.round(attack * 10) / 10,
    defense: Math.round(defense * 10) / 10,
    maxHp: Math.round(maxHp),
    critChance: clamp(critChance, 0, 0.9),
    critDamage,
    attackSpeed: clamp(attackSpeed, 0.4, 8),
    goldMultiplier,
    dropMultiplier,
    expMultiplier,
    bossDamageBonus,
    lifesteal: clamp(lifesteal, 0, 0.35),
  }
}

export function rollDamage(
  attackerAtk: number,
  defenderDef: number,
  opts: {
    critChance: number
    critDamage: number
    combo: number
    isBossTarget?: boolean
    bossDamageBonus?: number
    executeThreshold?: number
    targetHpRatio?: number
  },
) {
  const variance = 0.85 + Math.random() * 0.3
  let raw = Math.max(1, attackerAtk * variance - defenderDef * 0.55)
  const isCrit = Math.random() < opts.critChance
  const isPerfect = Math.random() < 0.04 + opts.combo * 0.001
  const isBackAttack = Math.random() < 0.03
  const isExecute = (opts.targetHpRatio ?? 1) <= (opts.executeThreshold ?? 0.12) && Math.random() < 0.35

  if (isCrit) raw *= opts.critDamage
  if (isPerfect) raw *= 1.35
  if (isBackAttack) raw *= 1.25
  if (isExecute) raw *= 2.2
  if (opts.isBossTarget) raw *= 1 + (opts.bossDamageBonus ?? 0)
  raw *= 1 + Math.min(0.5, opts.combo * 0.01)

  let color: 'white' | 'yellow' | 'orange' | 'red' | 'green' | 'cyan' = 'white'
  if (isExecute) color = 'red'
  else if (isCrit && isPerfect) color = 'red'
  else if (isCrit) color = 'orange'
  else if (isPerfect || isBackAttack) color = 'yellow'

  return {
    amount: Math.max(1, Math.round(raw)),
    isCrit,
    isPerfect,
    isExecute,
    isBackAttack,
    color,
    label: isExecute ? 'EXECUTE' : isPerfect ? 'PERFECT' : isBackAttack ? 'BACK' : undefined,
  }
}

export function applyDamage(target: import('@/types/game').Combatant, amount: number) {
  return { ...target, hp: Math.max(0, target.hp - amount) }
}

export function mitigatedDamage(raw: number, defense: number) {
  return Math.max(1, Math.round(raw - defense * 0.4))
}
