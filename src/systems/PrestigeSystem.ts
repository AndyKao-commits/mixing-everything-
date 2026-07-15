import { MAPS } from '@/data/maps'
import type { MapId, Player } from '@/types/game'
import { createPlayer } from '@/utils/playerFactory'

export function prestigeRequirement(player: Player) {
  return 30 + player.prestigeLevel * 20
}

export function canPrestige(player: Player) {
  return player.currentWave >= prestigeRequirement(player)
}

export function doPrestige(player: Player): Player {
  if (!canPrestige(player)) return player
  const fresh = createPlayer()
  const nextLevel = player.prestigeLevel + 1
  const coins = 1 + Math.floor(player.currentWave / 40) + player.prestigeLevel
  const unlockedMaps: MapId[] = Object.values(MAPS)
    .filter((map) => nextLevel >= map.unlockPrestige)
    .map((map) => map.id)
  if (!unlockedMaps.includes('grassland')) unlockedMaps.unshift('grassland')

  return {
    ...fresh,
    prestigeLevel: nextLevel,
    prestigeCoins: player.prestigeCoins + coins,
    gems: player.gems + 5,
    achievements: player.achievements,
    settings: player.settings,
    playTime: player.playTime,
    skillClass: player.skillClass,
    unlockedSkills: [],
    skillPoints: 2 + player.prestigeLevel,
    unlockedMaps,
    goldMultiplier: 1 + nextLevel * 0.05,
    dropMultiplier: 1 + nextLevel * 0.03,
    expMultiplier: 1 + nextLevel * 0.03,
    createdAt: player.createdAt,
  }
}
