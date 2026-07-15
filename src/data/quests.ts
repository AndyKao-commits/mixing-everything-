import type { QuestDef } from '@/types/game'

export const QUESTS: QuestDef[] = [
  { id: 'daily-kills', type: 'daily', title: '每日清掃', description: '擊殺 40 隻怪物', target: 40, metric: 'kills', rewards: { gold: 180, gems: 2 } },
  { id: 'daily-boss', type: 'daily', title: '每日試煉', description: '擊敗 1 位 Boss', target: 1, metric: 'bossKills', rewards: { gold: 220, gems: 3, skillPoints: 1 } },
  { id: 'weekly-kills', type: 'weekly', title: '週征討', description: '擊殺 400 隻怪物', target: 400, metric: 'kills', rewards: { gold: 1800, gems: 12, skillPoints: 2 } },
  { id: 'weekly-waves', type: 'weekly', title: '浪潮征服', description: '推进 80 波', target: 80, metric: 'waves', rewards: { gold: 2200, gems: 15 } },
  { id: 'story-1', type: 'story', title: '初入草原', description: '達到第 10 波', target: 10, metric: 'waves', rewards: { gold: 150, skillPoints: 1 } },
  { id: 'story-2', type: 'story', title: '霧林關卡', description: '達到第 25 波', target: 25, metric: 'waves', rewards: { gold: 400, gems: 4, skillPoints: 1 } },
  { id: 'story-3', type: 'story', title: '洞中試煉', description: '達到第 45 波', target: 45, metric: 'waves', rewards: { gold: 900, gems: 8, skillPoints: 2 } },
  { id: 'hidden-craft', type: 'hidden', title: '鑄造狂想', description: '鍛造／附魔 20 次', target: 20, metric: 'crafts', rewards: { gems: 20, skillPoints: 2 } },
  { id: 'hidden-gold', type: 'hidden', title: '暴發戶', description: '累積獲得金幣指標達成 50000', target: 50000, metric: 'gold', rewards: { gems: 25, item: 'weapon-pack' } },
]
