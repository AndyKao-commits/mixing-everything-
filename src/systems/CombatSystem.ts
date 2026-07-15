import { getMonster } from '@/data/monsters'
import { calcPlayerDpsStats, rollDamage, applyDamage, mitigatedDamage } from '@/systems/DamageSystem'
import { grantKillRewards } from '@/systems/EconomySystem'
import { openBossChest, updateBossPhases } from '@/systems/BossSystem'
import { advanceWave, spawnWaveEnemy } from '@/systems/WaveSystem'
import { rollLootEquipment } from '@/systems/LootSystem'
import { trackQuest } from '@/systems/QuestSystem'
import { evaluateAchievements } from '@/systems/AchievementSystem'
import { pruneFloating, pruneFx, spawnFloating, spawnFx } from '@/systems/EffectSystem'
import { playSfx } from '@/systems/AudioSystem'
import type { Combatant, FloatingText, GameRuntime, Player, WeaponEffectId } from '@/types/game'
import { chance } from '@/utils/math'

export type CombatTickResult = {
  player: Player
  runtime: GameRuntime
  leveled: boolean
}

function weaponEffects(player: Player): WeaponEffectId[] {
  return Object.values(player.equipment)
    .map((item) => item?.effect)
    .filter((e): e is WeaponEffectId => Boolean(e))
}

function tickStatus(enemy: Combatant, dt: number): { enemy: Combatant; dots: number } {
  let dots = 0
  const status = enemy.status
    .map((s) => {
      const remainingMs = s.remainingMs - dt
      let lastTickAt = s.lastTickAt
      if (performance.now() - lastTickAt >= s.tickEveryMs) {
        dots += s.power
        lastTickAt = performance.now()
      }
      return { ...s, remainingMs, lastTickAt }
    })
    .filter((s) => s.remainingMs > 0)
  return { enemy: applyDamage({ ...enemy, status }, dots), dots }
}

export function createRuntime(): GameRuntime {
  return {
    enemy: null,
    playerAtkCd: 0,
    enemyAtkCd: 0.4,
    skillCd: { burst: 0 },
    floating: [],
    fx: [],
    lastFrameAt: performance.now(),
    paused: false,
    waveClearing: false,
    offlineClaimed: false,
  }
}

export function ensureEnemy(player: Player, runtime: GameRuntime): GameRuntime {
  if (runtime.enemy && runtime.enemy.hp > 0) return runtime
  const enemy = spawnWaveEnemy(player)
  const fx = [...runtime.fx, spawnFx(enemy.isBoss ? 'boss' : 'hit')]
  if (enemy.isBoss) playSfx('boss', player.settings.sound)
  return { ...runtime, enemy, playerAtkCd: 0.15, enemyAtkCd: 0.6, fx }
}

export function castBurstSkill(player: Player, runtime: GameRuntime): CombatTickResult | null {
  if (!runtime.enemy || runtime.skillCd.burst > 0) return null
  const stats = calcPlayerDpsStats(player)
  const dmg = rollDamage(stats.attack * 2.4, runtime.enemy.defense, {
    critChance: stats.critChance + 0.15,
    critDamage: stats.critDamage + 0.4,
    combo: player.combo,
    isBossTarget: runtime.enemy.isBoss,
    bossDamageBonus: stats.bossDamageBonus,
    targetHpRatio: runtime.enemy.hp / runtime.enemy.maxHp,
  })
  let enemy = applyDamage(runtime.enemy, dmg.amount)
  enemy = updateBossPhases(enemy)
  const floating = [
    ...runtime.floating,
    spawnFloating(String(dmg.amount), dmg.color),
    spawnFloating('SKILL', 'cyan', 45, 55),
  ]
  playSfx(dmg.isCrit ? 'critical' : 'attack', player.settings.sound)
  return resolveEnemyState(player, {
    ...runtime,
    enemy,
    floating,
    fx: [...runtime.fx, spawnFx(dmg.isCrit ? 'crit' : 'hit')],
    skillCd: { ...runtime.skillCd, burst: 6 },
  })
}

function resolveEnemyState(player: Player, runtime: GameRuntime): CombatTickResult {
  let nextPlayer = player
  let nextRuntime = runtime
  let leveled = false
  const enemy = runtime.enemy
  if (!enemy) return { player, runtime, leveled }

  if (enemy.hp <= 0) {
    const base = getMonster(enemy.defId)
    const effects = weaponEffects(player)
    const beforeLevel = nextPlayer.level
    nextPlayer = grantKillRewards(nextPlayer, base?.goldDrop ?? 8, base?.expDrop ?? 10, {
      doubleGold: effects.includes('doubleGold'),
      doubleExp: effects.includes('doubleExp'),
    })
    leveled = nextPlayer.level > beforeLevel
    nextPlayer = {
      ...nextPlayer,
      combo: nextPlayer.combo + 1,
      maxCombo: Math.max(nextPlayer.maxCombo, nextPlayer.combo + 1),
      bossKills: nextPlayer.bossKills + (enemy.isBoss ? 1 : 0),
    }
    nextPlayer = trackQuest(nextPlayer, 'kills', 1)
    if (enemy.isBoss) nextPlayer = trackQuest(nextPlayer, 'bossKills', 1)
    nextPlayer = trackQuest(nextPlayer, 'waves', 0)
    if (enemy.isBoss) nextPlayer = openBossChest(nextPlayer)

    const stats = calcPlayerDpsStats(nextPlayer)
    if (chance(Math.min(0.55, 0.12 * stats.dropMultiplier))) {
      const loot = rollLootEquipment(nextPlayer)
      nextPlayer = { ...nextPlayer, inventory: [...nextPlayer.inventory, loot].slice(0, 120) }
      playSfx('loot', nextPlayer.settings.sound)
      nextRuntime = {
        ...nextRuntime,
        floating: [...nextRuntime.floating, spawnFloating(loot.name, 'yellow', 60, 30)],
        fx: [...nextRuntime.fx, spawnFx('loot')],
      }
    }

    // materials
    nextPlayer = {
      ...nextPlayer,
      materials: nextPlayer.materials.map((mat) =>
        mat.id === 'scrap'
          ? { ...mat, qty: mat.qty + 1 + Math.floor(Math.random() * 2) }
          : mat.id === 'essence' && chance(0.25)
            ? { ...mat, qty: mat.qty + 1 }
            : mat.id === 'core' && enemy.isBoss
              ? { ...mat, qty: mat.qty + 1 }
              : mat,
      ),
    }

    nextPlayer = advanceWave(nextPlayer)
    nextPlayer = trackQuest(nextPlayer, 'waves', 1)
    nextPlayer = evaluateAchievements(nextPlayer)

    playSfx(enemy.isBoss ? 'victory' : 'hit', nextPlayer.settings.sound)
    if (leveled) playSfx('levelup', nextPlayer.settings.sound)

    nextRuntime = {
      ...nextRuntime,
      enemy: null,
      floating: [...nextRuntime.floating, spawnFloating('CLEAR', 'green')],
      fx: [...nextRuntime.fx, spawnFx('death'), ...(leveled ? [spawnFx('levelup')] : [])],
      waveClearing: true,
    }
  }

  return { player: nextPlayer, runtime: nextRuntime, leveled }
}

export function tickCombat(player: Player, runtime: GameRuntime, dtSec: number): CombatTickResult {
  if (runtime.paused) return { player, runtime, leveled: false }
  let nextPlayer = {
    ...player,
    playTime: player.playTime + dtSec,
  }
  let nextRuntime: GameRuntime = {
    ...runtime,
    playerAtkCd: Math.max(0, runtime.playerAtkCd - dtSec),
    enemyAtkCd: Math.max(0, runtime.enemyAtkCd - dtSec),
    skillCd: Object.fromEntries(
      Object.entries(runtime.skillCd).map(([k, v]) => [k, Math.max(0, v - dtSec)]),
    ),
    floating: pruneFloating(runtime.floating),
    fx: pruneFx(runtime.fx),
    waveClearing: false,
  }

  nextRuntime = ensureEnemy(nextPlayer, nextRuntime)
  if (!nextRuntime.enemy) return { player: nextPlayer, runtime: nextRuntime, leveled: false }

  // DoT
  const statusTick = tickStatus(nextRuntime.enemy, dtSec * 1000)
  nextRuntime = { ...nextRuntime, enemy: statusTick.enemy }
  if (statusTick.dots > 0 && nextPlayer.settings.damageNumbers) {
    nextRuntime = {
      ...nextRuntime,
      floating: [...nextRuntime.floating, spawnFloating(String(statusTick.dots), 'green')],
    }
  }

  const deadCheck = resolveEnemyState(nextPlayer, nextRuntime)
  if (!deadCheck.runtime.enemy) return deadCheck
  nextPlayer = deadCheck.player
  nextRuntime = deadCheck.runtime

  const stats = calcPlayerDpsStats(nextPlayer)
  const effects = weaponEffects(nextPlayer)

  // Player auto attack
  if (nextPlayer.autoBattle && nextRuntime.playerAtkCd <= 0 && nextRuntime.enemy) {
    let enemy = nextRuntime.enemy
    const frozen = enemy.status.some((s) => s.id === 'freeze')
    const dmg = rollDamage(stats.attack, enemy.defense * (frozen ? 0.7 : 1), {
      critChance: stats.critChance,
      critDamage: stats.critDamage,
      combo: nextPlayer.combo,
      isBossTarget: enemy.isBoss,
      bossDamageBonus: stats.bossDamageBonus,
      targetHpRatio: enemy.hp / enemy.maxHp,
    })
    let amount = dmg.amount
    if (effects.includes('fire')) amount += Math.round(stats.attack * 0.15)
    if (effects.includes('chain') && chance(0.25)) amount += Math.round(stats.attack * 0.35)

    enemy = applyDamage(enemy, amount)
    enemy = updateBossPhases(enemy)

    // apply status
    const status = [...enemy.status]
    if (effects.includes('poison') && chance(0.3)) {
      status.push({ id: 'poison', remainingMs: 3000, power: Math.round(2 + stats.attack * 0.05), tickEveryMs: 700, lastTickAt: 0 })
    }
    if (effects.includes('bleed') && chance(0.28)) {
      status.push({ id: 'bleed', remainingMs: 2500, power: Math.round(3 + stats.attack * 0.04), tickEveryMs: 600, lastTickAt: 0 })
    }
    if (effects.includes('freeze') && chance(0.18)) {
      status.push({ id: 'freeze', remainingMs: 1200, power: 0, tickEveryMs: 9999, lastTickAt: performance.now() })
    }
    enemy = { ...enemy, status }

    if (stats.lifesteal > 0) {
      const heal = Math.round(amount * stats.lifesteal)
      nextPlayer = { ...nextPlayer, hp: Math.min(stats.maxHp, nextPlayer.hp + heal) }
    }

    const floating: FloatingText[] = [...nextRuntime.floating]
    if (nextPlayer.settings.damageNumbers) {
      floating.push(spawnFloating(String(amount), dmg.color))
      if (dmg.label) floating.push(spawnFloating(dmg.label, 'red', 40, 60))
    }

    playSfx(dmg.isCrit ? 'critical' : 'attack', nextPlayer.settings.sound)
    nextRuntime = {
      ...nextRuntime,
      enemy,
      playerAtkCd: 1 / stats.attackSpeed,
      floating,
      fx: [...nextRuntime.fx, spawnFx(dmg.isCrit ? 'crit' : 'hit'), ...(dmg.isCrit ? [spawnFx('shake')] : [])],
    }

    const resolved = resolveEnemyState(nextPlayer, nextRuntime)
    nextPlayer = resolved.player
    nextRuntime = resolved.runtime
  }

  // Enemy attack
  if (nextRuntime.enemy && nextRuntime.enemy.hp > 0 && nextRuntime.enemyAtkCd <= 0) {
    const enemy = nextRuntime.enemy
    const frozen = enemy.status.some((s) => s.id === 'freeze')
    if (!frozen) {
      let raw = enemy.attack * (enemy.raging ? 1.25 : 1) * (enemy.phase === 2 ? 1.1 : 1)
      const ability = getMonster(enemy.defId)?.abilities[0]
      if (ability && chance(ability.chance)) raw *= ability.power
      const dealt = mitigatedDamage(raw, stats.defense)
      nextPlayer = {
        ...nextPlayer,
        hp: Math.max(0, nextPlayer.hp - dealt),
        combo: 0,
      }
      if (nextPlayer.settings.damageNumbers) {
        nextRuntime = {
          ...nextRuntime,
          floating: [...nextRuntime.floating, spawnFloating(`-${dealt}`, 'red', 30, 35)],
          fx: [...nextRuntime.fx, spawnFx('shake')],
        }
      }
      playSfx('hit', nextPlayer.settings.sound)
    }
    nextRuntime = {
      ...nextRuntime,
      enemyAtkCd: 1 / Math.max(0.35, enemy.speed * (frozen ? 0.4 : 1)),
    }
  }

  // soft regen while healthy combo
  if (nextPlayer.combo > 10 && chance(0.02)) {
    nextPlayer = { ...nextPlayer, hp: Math.min(stats.maxHp, nextPlayer.hp + 1) }
  }

  // sync max hp from stats
  if (nextPlayer.hp > stats.maxHp) nextPlayer = { ...nextPlayer, hp: stats.maxHp }

  return { player: nextPlayer, runtime: nextRuntime, leveled: false }
}

export function drinkPotion(player: Player): Player | null {
  if (player.potions <= 0) return null
  const stats = calcPlayerDpsStats(player)
  return {
    ...player,
    potions: player.potions - 1,
    hp: Math.min(stats.maxHp, player.hp + Math.round(stats.maxHp * 0.35)),
  }
}
