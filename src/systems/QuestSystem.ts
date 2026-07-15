import { QUESTS } from '@/data/quests'
import type { Player, QuestProgress } from '@/types/game'

function periodEnd(type: 'daily' | 'weekly') {
  const now = new Date()
  if (type === 'daily') {
    const end = new Date(now)
    end.setHours(24, 0, 0, 0)
    return end.getTime()
  }
  const end = new Date(now)
  const day = end.getDay()
  const diff = (7 - day) % 7 || 7
  end.setDate(end.getDate() + diff)
  end.setHours(0, 0, 0, 0)
  return end.getTime()
}

export function ensureQuests(player: Player): Player {
  const byId = new Map(player.quests.map((q) => [q.id, q]))
  const next: QuestProgress[] = QUESTS.map((def) => {
    const existing = byId.get(def.id)
    if (existing) {
      if (existing.resetsAt && Date.now() > existing.resetsAt) {
        return {
          id: def.id,
          progress: 0,
          completed: false,
          claimed: false,
          resetsAt: def.type === 'daily' || def.type === 'weekly' ? periodEnd(def.type) : undefined,
        }
      }
      return existing
    }
    return {
      id: def.id,
      progress: 0,
      completed: false,
      claimed: false,
      resetsAt: def.type === 'daily' || def.type === 'weekly' ? periodEnd(def.type) : undefined,
    }
  })
  return { ...player, quests: next }
}

export function trackQuest(
  player: Player,
  metric: 'kills' | 'bossKills' | 'gold' | 'level' | 'waves' | 'crafts',
  amount = 1,
): Player {
  const defs = new Map(QUESTS.map((q) => [q.id, q]))
  const quests = player.quests.map((q) => {
    const def = defs.get(q.id)
    if (!def || def.metric !== metric || q.claimed) return q
    const progress = Math.min(def.target, q.progress + amount)
    return {
      ...q,
      progress,
      completed: progress >= def.target,
    }
  })
  return { ...player, quests }
}

export function claimQuest(player: Player, questId: string): Player | null {
  const def = QUESTS.find((q) => q.id === questId)
  const progress = player.quests.find((q) => q.id === questId)
  if (!def || !progress || !progress.completed || progress.claimed) return null
  return {
    ...player,
    gold: player.gold + (def.rewards.gold ?? 0),
    gems: player.gems + (def.rewards.gems ?? 0),
    skillPoints: player.skillPoints + (def.rewards.skillPoints ?? 0),
    potions: player.potions + (def.rewards.item ? 1 : 0),
    quests: player.quests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
  }
}
