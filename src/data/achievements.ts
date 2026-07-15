import type { AchievementDef } from '@/types/game'

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'kill-100', title: '百人斬', description: '擊殺 100 隻怪物', metric: 'kills', target: 100, reward: { gold: 200, skillPoints: 1 } },
  { id: 'kill-1000', title: '千人斬', description: '擊殺 1000 隻怪物', metric: 'kills', target: 1000, reward: { gold: 1500, gems: 10, skillPoints: 2 } },
  { id: 'kill-10000', title: '萬人斬', description: '擊殺 10000 隻怪物', metric: 'kills', target: 10000, reward: { gold: 12000, gems: 40, skillPoints: 5 } },
  { id: 'lv-10', title: '新銳巡衛', description: '達到等級 10', metric: 'level', target: 10, reward: { gold: 300, skillPoints: 1 } },
  { id: 'lv-50', title: '資深討伐者', description: '達到等級 50', metric: 'level', target: 50, reward: { gold: 3000, gems: 15, skillPoints: 3 } },
  { id: 'lv-100', title: '百級傳說', description: '達到等級 100', metric: 'level', target: 100, reward: { gold: 15000, gems: 50, skillPoints: 8 } },
  { id: 'boss-1', title: '首次屠魔', description: '擊敗 1 位 Boss', metric: 'bossKills', target: 1, reward: { gold: 250, gems: 3 } },
  { id: 'boss-10', title: 'Boss 獵人', description: '擊敗 10 位 Boss', metric: 'bossKills', target: 10, reward: { gold: 2500, gems: 20, skillPoints: 2 } },
  { id: 'legendary-1', title: '傳說收藏家', description: '持有傳說級裝備', metric: 'legendaryOwned', target: 1, reward: { gems: 8, skillPoints: 1 } },
  { id: 'prestige-1', title: '輪迴起步', description: '完成一次轉生', metric: 'prestigeLevel', target: 1, reward: { gems: 25, skillPoints: 5 } },
  { id: 'play-10h', title: '十年磨一劍（大概）', description: '遊玩累計 10 小時', metric: 'playHours', target: 10, reward: { gold: 5000, gems: 20 } },
  { id: 'maps-4', title: '開拓者', description: '解鎖 4 張地圖', metric: 'mapsUnlocked', target: 4, reward: { gold: 2000, skillPoints: 2 } },
  { id: 'combo-50', title: '連擊狂', description: '單場最高連擊 50', metric: 'maxCombo', target: 50, reward: { gold: 800, gems: 5 } },
  { id: 'secret-gold', title: '隱秘金庫', description: '持有金幣達到 100000', metric: 'gold', target: 100000, reward: { gems: 30, skillPoints: 3 } },
]
