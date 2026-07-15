import { MAPS } from '@/data/maps'
import { getBoss, getMonster, MONSTERS } from '@/data/monsters'
import type { Combatant, MapId, Monster, Player } from '@/types/game'
import { bossScale, enemyScale, pick } from '@/utils/math'

export function isBossWave(wave: number) {
  return wave > 0 && wave % 10 === 0
}

export function mapMonsters(mapId: MapId): Monster[] {
  const map = MAPS[mapId]
  return map.monsterIds.map((id) => getMonster(id)).filter((m): m is Monster => Boolean(m))
}

export function scaleMonsterToCombatant(
  monster: Monster,
  wave: number,
  mapId: MapId,
  isBoss = false,
): Combatant {
  const diff = MAPS[mapId].difficulty
  const scale = isBoss ? bossScale(wave, diff) : enemyScale(wave, diff)
  const hp = Math.round(monster.hp * scale)
  return {
    id: `${monster.id}-${wave}-${Math.random().toString(36).slice(2, 6)}`,
    defId: monster.id,
    name: monster.nameZh,
    hp,
    maxHp: hp,
    attack: Math.round(monster.attack * scale * 0.85),
    defense: Math.round(monster.defense * Math.sqrt(scale)),
    speed: monster.speed,
    isBoss,
    phase: 1,
    raging: false,
    color: monster.color,
    sprite: monster.sprite,
    status: [],
    rarity: monster.rarity,
  }
}

export function spawnWaveEnemy(player: Player): Combatant {
  const mapId = player.currentMap
  const wave = player.currentWave
  if (isBossWave(wave)) {
    const boss = getBoss(MAPS[mapId].bossId)
    if (boss) return scaleMonsterToCombatant(boss, wave, mapId, true)
  }
  const pool = mapMonsters(mapId)
  const monster = pick(pool.length ? pool : MONSTERS)
  return scaleMonsterToCombatant(monster, wave, mapId, false)
}

export function advanceWave(player: Player): Player {
  const nextWave = player.currentWave + 1
  const unlocked = new Set(player.unlockedMaps)
  for (const map of Object.values(MAPS)) {
    if (nextWave >= map.unlockWave && player.prestigeLevel >= map.unlockPrestige) {
      unlocked.add(map.id)
    }
  }
  return {
    ...player,
    currentWave: nextWave,
    unlockedMaps: [...unlocked],
  }
}

export function canTravel(player: Player, mapId: MapId) {
  return player.unlockedMaps.includes(mapId)
}
