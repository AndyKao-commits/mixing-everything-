import { ACHIEVEMENTS } from '@/data/achievements'
import type { Player } from '@/types/game'

function metricValue(player: Player, metric: (typeof ACHIEVEMENTS)[number]['metric']) {
  if (metric === 'legendaryOwned') {
    const all = [...player.inventory, ...Object.values(player.equipment)].filter(Boolean)
    return all.filter((item) => item && ['legendary', 'mythic', 'ancient', 'divine'].includes(item.rarity)).length
  }
  if (metric === 'mapsUnlocked') return player.unlockedMaps.length
  if (metric === 'playHours') return player.playTime / 3600
  return Number(player[metric as keyof Player] ?? 0)
}

export function evaluateAchievements(player: Player): Player {
  let next = player
  for (const def of ACHIEVEMENTS) {
    if (next.achievements.includes(def.id)) continue
    if (metricValue(next, def.metric) < def.target) continue
    next = {
      ...next,
      achievements: [...next.achievements, def.id],
      gold: next.gold + (def.reward.gold ?? 0),
      gems: next.gems + (def.reward.gems ?? 0),
      skillPoints: next.skillPoints + (def.reward.skillPoints ?? 0),
    }
  }
  return next
}
