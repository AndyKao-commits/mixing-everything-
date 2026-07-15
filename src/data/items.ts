import type { ShopOffer } from '@/types/game'

export const SHOP_OFFERS: ShopOffer[] = [
  { id: 'potion', name: '回復藥劑', description: '戰鬥中可用，回復 35% 生命', kind: 'potion', costGold: 40 },
  { id: 'weapon-pack', name: '武器箱', description: '隨機武器一件', kind: 'weapon', costGold: 120 },
  { id: 'armor-pack', name: '防具箱', description: '隨機防具一件', kind: 'armor', costGold: 120 },
  { id: 'chest', name: '寶箱', description: '隨機裝備（稀有權重提升）', kind: 'chest', costGold: 220 },
  { id: 'random-box', name: '神秘盲盒', description: '金幣／寶石／裝備隨機', kind: 'randomBox', costGems: 5 },
  { id: 'legendary-box', name: '傳說盲盒', description: '至少史詩級裝備', kind: 'legendaryBox', costGems: 25 },
  { id: 'skin-ember', name: '餘燼皮', description: '展示用皮膚（永久收藏標記）', kind: 'skin', costGems: 15 },
]

export const MATERIAL_IDS = ['scrap', 'essence', 'core', 'scroll'] as const

export type MaterialId = (typeof MATERIAL_IDS)[number]

export const MATERIAL_LABEL: Record<MaterialId, string> = {
  scrap: '廢鐵',
  essence: '精華',
  core: '魔核',
  scroll: '附魔卷軸',
}
