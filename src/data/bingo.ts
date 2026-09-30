import type { BingoCategory } from '@/types'

export interface BingoPrompt {
  id: string
  category: BingoCategory
  text: string
  pool?: string
}

export const FOOD_PROMPTS: BingoPrompt[] = [
  { id: 'f1', category: 'food', text: '拍到生豬肉', pool: 'raw_meat' },
  { id: 'f2', category: 'food', text: '拍到生牛肉', pool: 'raw_meat' },
  { id: 'f3', category: 'food', text: '拍到生雞肉', pool: 'raw_meat' },
  { id: 'f4', category: 'food', text: '拍到生海鮮', pool: 'raw_meat' },
  { id: 'f5', category: 'food', text: '拍到烤焦的肉' },
  { id: 'f6', category: 'food', text: '拍到烤焦的菜' },
  { id: 'f7', category: 'food', text: '拍到正在滴油的肉' },
  { id: 'f8', category: 'food', text: '拍到正在冒煙的食物' },
  { id: 'f9', category: 'food', text: '拍到只剩最後一口的食物' },
  { id: 'f10', category: 'food', text: '拍到一盤全部都是肉' },
  { id: 'f11', category: 'food', text: '拍到一盤完全沒有肉' },
  { id: 'f12', category: 'food', text: '拍到今天最好看的烤肉' },
  { id: 'f13', category: 'food', text: '拍到今天賣相最慘的食物' },
]

export const OBJECT_PROMPTS: BingoPrompt[] = [
  { id: 'o1', category: 'object', text: '拍到垃圾' },
  { id: 'o2', category: 'object', text: '拍到空盤子' },
  { id: 'o3', category: 'object', text: '拍到裝滿食物的盤子' },
  { id: 'o4', category: 'object', text: '拍到烤肉夾' },
  { id: 'o5', category: 'object', text: '拍到衛生紙' },
  { id: 'o6', category: 'object', text: '拍到三種不同飲料' },
  { id: 'o7', category: 'object', text: '拍到空飲料瓶' },
  { id: 'o8', category: 'object', text: '拍到調味料' },
  { id: 'o9', category: 'object', text: '拍到炭火' },
  { id: 'o10', category: 'object', text: '拍到火焰' },
  { id: 'o11', category: 'object', text: '拍到紅色物品' },
  { id: 'o12', category: 'object', text: '拍到圓形物品' },
  { id: 'o13', category: 'object', text: '拍到三個相同物品' },
  { id: 'o14', category: 'object', text: '拍到一個看起來不應該出現在烤肉現場的東西' },
]

export const PEOPLE_PROMPTS: BingoPrompt[] = [
  { id: 'p1', category: 'people', text: '跟兩個人合照' },
  { id: 'p2', category: 'people', text: '跟三個人合照' },
  { id: 'p3', category: 'people', text: '跟穿黑色衣服的人合照' },
  { id: 'p4', category: 'people', text: '跟穿白色衣服的人合照' },
  { id: 'p5', category: 'people', text: '跟某人比 YA' },
  { id: 'p6', category: 'people', text: '跟某人比愛心' },
  { id: 'p7', category: 'people', text: '跟正在吃東西的人自拍' },
  { id: 'p8', category: 'people', text: '跟正在烤肉的人自拍' },
  { id: 'p9', category: 'people', text: '跟某人背對背拍照' },
  { id: 'p10', category: 'people', text: '跟某人做醜表情' },
  { id: 'p11', category: 'people', text: '三個人拍家庭照' },
  { id: 'p12', category: 'people', text: '拍一張像專輯封面的照片' },
]

export const MOMENT_PROMPTS: BingoPrompt[] = [
  { id: 'm1', category: 'moment', text: '拍到有人正在吃東西' },
  { id: 'm2', category: 'moment', text: '拍到有人嘴巴塞滿食物' },
  { id: 'm3', category: 'moment', text: '拍到有人在烤肉' },
  { id: 'm4', category: 'moment', text: '拍到有人在滑手機' },
  { id: 'm5', category: 'moment', text: '拍到有人在拍照' },
  { id: 'm6', category: 'moment', text: '拍到有人在自拍' },
  { id: 'm7', category: 'moment', text: '拍到有人在倒飲料' },
  { id: 'm8', category: 'moment', text: '拍到有人拿兩個盤子' },
  { id: 'm9', category: 'moment', text: '拍到有人大笑' },
  { id: 'm10', category: 'moment', text: '拍到有人在收垃圾' },
  { id: 'm11', category: 'moment', text: '拍到有人正在偷吃' },
  { id: 'm12', category: 'moment', text: '拍到有人夾東西失敗' },
]

export const CREATIVE_PROMPTS: BingoPrompt[] = [
  { id: 'c1', category: 'creative', text: '拍一張適合做迷因的照片' },
  { id: 'c2', category: 'creative', text: '拍一張「這場聚會失控了」的照片' },
  { id: 'c3', category: 'creative', text: '拍一張「看起來很貴」的照片' },
  { id: 'c4', category: 'creative', text: '拍一張「看起來很窮」的照片' },
  { id: 'c5', category: 'creative', text: '拍一張「明明沒事但看起來出大事」的照片' },
  { id: 'c6', category: 'creative', text: '拍一張明天大家看到還會笑的照片' },
]

export const MYSTERY_PROMPTS: BingoPrompt[] = [
  { id: 'x1', category: 'mystery', text: '找一個人跟你碰杯，但不能先說乾杯' },
  { id: 'x2', category: 'mystery', text: '讓某人主動問「你在幹嘛」' },
  { id: 'x3', category: 'mystery', text: '讓某人主動拿食物給你' },
  { id: 'x4', category: 'mystery', text: '拍到兩個人做一樣的動作' },
  { id: 'x5', category: 'mystery', text: '拍到有人正在偷吃' },
  { id: 'x6', category: 'mystery', text: '拍到肉＋飲料＋人＋火同時出現' },
  { id: 'x7', category: 'mystery', text: '拍一張至少 5 人的照片' },
  { id: 'x8', category: 'mystery', text: '找某人合照，但只有你可以笑' },
  { id: 'x9', category: 'mystery', text: '拍一張「看起來很貴」的照片' },
  { id: 'x10', category: 'mystery', text: '拍一張「看起來很窮」的照片' },
  { id: 'x11', category: 'mystery', text: '拍一張「這場聚會失控了」的照片' },
  { id: 'x12', category: 'mystery', text: '拍一張適合做迷因的照片' },
  { id: 'x13', category: 'mystery', text: '拍一張「明明沒事但看起來出大事」的照片' },
  { id: 'x14', category: 'mystery', text: '拍一張明天大家看到還會笑的照片' },
  { id: 'x15', category: 'mystery', text: '讓三個人同時比 YA' },
  { id: 'x16', category: 'mystery', text: '拍到有人正在幫別人烤肉' },
  { id: 'x17', category: 'mystery', text: '拍到有人一次拿超過兩個東西' },
  { id: 'x18', category: 'mystery', text: '找到現場最小的食物並拍照' },
  { id: 'x19', category: 'mystery', text: '找到現場最大的食物並拍照' },
  { id: 'x20', category: 'mystery', text: '拍一張「只有懂的人才會笑」的照片' },
  { id: 'x21', category: 'mystery', text: '讓某人用食物餵你一口' },
  { id: 'x22', category: 'mystery', text: '拍到有人正在認真討論無關烤肉的事' },
  { id: 'x23', category: 'mystery', text: '拍一張看起來像廣告的現場照' },
  { id: 'x24', category: 'mystery', text: '拍到四種不同顏色同時出現' },
  { id: 'x25', category: 'mystery', text: '拍到有人正在擦手或擦嘴' },
  { id: 'x26', category: 'mystery', text: '拍一張「今晚的主角」照片' },
  { id: 'x27', category: 'mystery', text: '拍到有人閉眼吃東西' },
  { id: 'x28', category: 'mystery', text: '拍到有人正在指著食物說話' },
  { id: 'x29', category: 'mystery', text: '拍一張「這應該上熱搜」的照片' },
  { id: 'x30', category: 'mystery', text: '找兩個人做同步動作並拍照' },
  { id: 'x31', category: 'mystery', text: '拍到有人邊吃邊比讚' },
  { id: 'x32', category: 'mystery', text: '拍一張只有手沒有臉的合照' },
  { id: 'x33', category: 'mystery', text: '拍到有人正在找位子坐下' },
  { id: 'x34', category: 'mystery', text: '拍一張「聚會官方宣傳圖」' },
  { id: 'x35', category: 'mystery', text: '讓某人幫你拍一張你正在烤肉的照片' },
  { id: 'x36', category: 'mystery', text: '拍到三種醬料同時入鏡' },
  { id: 'x37', category: 'mystery', text: '拍一張「今晚最安靜的人」' },
  { id: 'x38', category: 'mystery', text: '拍一張「今晚最吵的瞬間」' },
  { id: 'x39', category: 'mystery', text: '拍到有人正在互相夾菜' },
  { id: 'x40', category: 'mystery', text: '拍一張「大家都會想存下來」的照片' },
  { id: 'x41', category: 'mystery', text: '讓某人跟你碰拳或擊掌後拍照' },
  { id: 'x42', category: 'mystery', text: '拍到飲料溢出來或快滿出來' },
  { id: 'x43', category: 'mystery', text: '拍一張「看起來很專業但其實很隨便」' },
  { id: 'x44', category: 'mystery', text: '拍到有人拿筷子／夾子指東指西' },
  { id: 'x45', category: 'mystery', text: '拍一張「這張可以當桌布」的照片' },
  { id: 'x46', category: 'mystery', text: '找人一起做一個奇怪 pose' },
  { id: 'x47', category: 'mystery', text: '拍到有人正在偷瞄別人手機' },
  { id: 'x48', category: 'mystery', text: '拍一張「現場最有氣氛」的照片' },
  { id: 'x49', category: 'mystery', text: '拍到有人同時拿食物跟飲料' },
  { id: 'x50', category: 'mystery', text: '拍一張「如果這是電影海報」的照片' },
]
