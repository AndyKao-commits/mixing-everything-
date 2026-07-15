/** 《餘燼野原》— Fieldlife story bible & runtime chronicle helpers. */

export type ChapterId =
  | 'firstfall'
  | 'listengrass'
  | 'blooddew'
  | 'bladefaith'
  | 'farhill'
  | 'wolfsong'
  | 'crystalrain'
  | 'longroad'
  | 'embername'
  | 'closing'

export type Atmosphere = {
  sky: number
  fog: number
  ground: number
  accent: number
  sunIntensity: number
}

export type ChapterDef = {
  id: ChapterId
  index: number
  title: string
  subtitle: string
  unlockLine: string
  atmosphere: Atmosphere
}

export type LifeMetrics = {
  level: number
  kills: number
  explored: number
  stepsAlive: number
  rests: number
  slimeKills: number
  wolfKills: number
  crystalKills: number
}

export type ChronicleEntry = {
  tick: number
  kind: 'birth' | 'chapter' | 'memory' | 'battle' | 'rest' | 'omen' | 'epitaph'
  text: string
}

export type FateTitle = {
  id: string
  title: string
  epitaph: string
}

export const WORLD_LORE = {
  title: '餘燼野原',
  titleEn: 'Embergarden',
  premise:
    '死與夢之間，有一片記得腳印的野原。女神不開口，只替每個落下的魂翻頁。你每走一步、每打一仗，她就多寫一行。',
  rule: '這一世倒下或走盡長路，卷軸合上；下一段人生再從灰裡站起。',
}

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'firstfall',
    index: 0,
    title: '初落',
    subtitle: '落灰的第一口氣',
    unlockLine: '腳踩上溫熱的草。遠處有什麼東西在學會怎麼恨。',
    atmosphere: { sky: 0x1a2433, fog: 0x1a2433, ground: 0x3d5a45, accent: 0xd4a14a, sunIntensity: 1.0 },
  },
  {
    id: 'listengrass',
    index: 1,
    title: '聽草',
    subtitle: '野原開始認識你',
    unlockLine: '草葉對你側耳。風把還未發生的告解提前送來。',
    atmosphere: { sky: 0x1e2d28, fog: 0x1c2a26, ground: 0x3f6348, accent: 0x9fd0b8, sunIntensity: 0.95 },
  },
  {
    id: 'blooddew',
    index: 2,
    title: '血露',
    subtitle: '第一滴屬於你的露',
    unlockLine: '你終於讓什麼東西停止移動。露水裡多了一點銅腥。',
    atmosphere: { sky: 0x241820, fog: 0x22161c, ground: 0x4a3f38, accent: 0xe4572e, sunIntensity: 0.9 },
  },
  {
    id: 'bladefaith',
    index: 3,
    title: '刃信',
    subtitle: '身體學會回答危險',
    unlockLine: '肌肉記住了揮擊。信任不再給女神，只給你自己的手。',
    atmosphere: { sky: 0x22263a, fog: 0x1f2334, ground: 0x3a4a55, accent: 0xc9d6e4, sunIntensity: 1.05 },
  },
  {
    id: 'farhill',
    index: 4,
    title: '遠丘',
    subtitle: '地圖在腳底板長出來',
    unlockLine: '遠方的石頭交換了位置。野原承認你是過客，也是編纂者。',
    atmosphere: { sky: 0x243444, fog: 0x203040, ground: 0x45604f, accent: 0x6eb4ff, sunIntensity: 1.1 },
  },
  {
    id: 'wolfsong',
    index: 5,
    title: '狼歌',
    subtitle: '黃昏把自己壓低',
    unlockLine: '狼群用喉嚨替野原唱夜曲。你發現節奏可以殺，也可以活。',
    atmosphere: { sky: 0x2a1f2e, fog: 0x261b2a, ground: 0x3d3644, accent: 0xb08cff, sunIntensity: 0.75 },
  },
  {
    id: 'crystalrain',
    index: 6,
    title: '晶雨',
    subtitle: '碎掉的天空掉回地面',
    unlockLine: '晶靈像雨。每一擊都像把失落的星座重新縫回身上。',
    atmosphere: { sky: 0x1a2a44, fog: 0x17263f, ground: 0x355064, accent: 0x6eb4ff, sunIntensity: 1.2 },
  },
  {
    id: 'longroad',
    index: 7,
    title: '長路',
    subtitle: '時間開始聽見腳步',
    unlockLine: '你走得夠久，連影子也累了。野原開始用你的名字呼叫風。',
    atmosphere: { sky: 0x2c2418, fog: 0x282018, ground: 0x4d4a38, accent: 0xd4a14a, sunIntensity: 0.85 },
  },
  {
    id: 'embername',
    index: 8,
    title: '餘燼之名',
    subtitle: '這一世終於有了稱呼',
    unlockLine: '女神合上半頁紙，低聲念出你尚未說出口的稱號。',
    atmosphere: { sky: 0x3a2218, fog: 0x321c14, ground: 0x5a4030, accent: 0xff8a4c, sunIntensity: 1.15 },
  },
  {
    id: 'closing',
    index: 9,
    title: '閉卷',
    subtitle: '腳印沉入紙背',
    unlockLine: '頁緣焦了。野原把你這一世摺進灰裡，等下一段人生再拆開。',
    atmosphere: { sky: 0x10141c, fog: 0x0e1218, ground: 0x2a3034, accent: 0x9aabbd, sunIntensity: 0.55 },
  },
]

const LIFE_NAMES = [
  '灰嘴',
  '苔履',
  '無燈',
  '遠喘',
  '碎誓',
  '薄刃',
  '聽露',
  '慢烽',
  '夜穗',
  '回聲',
  '空弦',
  '暮咎',
  '微熾',
  '失頁',
  '行墨',
]

const BIRTH_LINES = [
  '你從紙縫跌出來，膝蓋先認識泥土。',
  '野原替你裝上一副尚未命名的眼睛。',
  '風說：這一世先活著，再談記不記得。',
  '餘燼還沒涼透。你正好夠溫。',
  '女神翻開空白頁，墨還沒決定恨你還是愛你。',
]

const MEMORY_BEATS: { id: string; when: (m: LifeMetrics) => boolean; text: string }[] = [
  { id: 'm-grass', when: (m) => m.explored >= 5, text: '記憶碎片：草在你腳印裡學會拼字。' },
  { id: 'm-firstblood', when: (m) => m.kills >= 1, text: '記憶碎片：第一聲倒地，比你想像中安靜。' },
  { id: 'm-slime', when: (m) => m.slimeKills >= 3, text: '記憶碎片：碧苔低語——「我們也曾是雨。」' },
  { id: 'm-wolf', when: (m) => m.wolfKills >= 2, text: '記憶碎片：狼眼裏有地圖，那地圖畫的是你。' },
  { id: 'm-crystal', when: (m) => m.crystalKills >= 1, text: '記憶碎片：碎光說天空曾經完整，然後它笑了。' },
  { id: 'm-rest', when: (m) => m.rests >= 6, text: '記憶碎片：休息不是懦弱，是把下一擊借回來。' },
  { id: 'm-road', when: (m) => m.stepsAlive >= 600, text: '記憶碎片：長路把恐懼磨成習慣。' },
  { id: 'm-flame', when: (m) => m.level >= 8, text: '記憶碎片：你胸腔裡有一小撮不肯熄的灰。' },
]

const OMENS = [
  '遠方有鐘，卻沒有寺。',
  '岩石上乾掉的蹄印比你先到此處。',
  '天色忽然偏心，把光全給別人。',
  '你背後的草站直了——像在敬禮，又像在警告。',
  '聽見自己的名字，卻想不起是誰喊的。',
  '一隻看不見的手替你數著心跳。',
]

function chapterUnlocked(id: ChapterId, m: LifeMetrics, closing = false): boolean {
  switch (id) {
    case 'firstfall':
      return true
    case 'listengrass':
      return m.explored >= 8
    case 'blooddew':
      return m.kills >= 3
    case 'bladefaith':
      return m.level >= 4
    case 'farhill':
      return m.explored >= 22
    case 'wolfsong':
      return m.wolfKills >= 2 || m.kills >= 10
    case 'crystalrain':
      return m.level >= 7 || m.crystalKills >= 1
    case 'longroad':
      return m.stepsAlive >= 800
    case 'embername':
      return m.level >= 10
    case 'closing':
      return closing
  }
}

export function resolveChapter(m: LifeMetrics, closing = false): ChapterDef {
  let current = CHAPTERS[0]!
  for (const ch of CHAPTERS) {
    if (chapterUnlocked(ch.id, m, closing)) current = ch
  }
  return current
}

export function pickLifeName(episode: number): string {
  const base = LIFE_NAMES[(episode - 1) % LIFE_NAMES.length]!
  return `餘灰・${base}`
}

export function birthLine(episode: number, rng: () => number): string {
  const line = BIRTH_LINES[Math.floor(rng() * BIRTH_LINES.length)]!
  return `第 ${episode} 世｜${line}`
}

export function battleFlavor(monsterName: string, killed: boolean, leveled: boolean, level: number): string {
  if (leveled) return `你把${monsterName}寫進冊頁，力量漲潮到 Lv.${level}。`
  if (killed) return `${monsterName}倒下。野原多記一筆「曾經威脅過你」。`
  return `刀鋒吻過${monsterName}。墨還沒乾。`
}

export function restFlavor(healed: number, full: boolean): string {
  if (full) return '你強行躺下，草只回你一陣乾笑。'
  return `你把耳朵貼近泥土，借回 ${healed} 點熱。`
}

export function omenLine(rng: () => number): string {
  return `預兆：${OMENS[Math.floor(rng() * OMENS.length)]!}`
}

export function collectNewMemories(
  m: LifeMetrics,
  unlocked: Set<string>,
): { id: string; text: string }[] {
  const found: { id: string; text: string }[] = []
  for (const beat of MEMORY_BEATS) {
    if (unlocked.has(beat.id)) continue
    if (beat.when(m)) {
      unlocked.add(beat.id)
      found.push({ id: beat.id, text: beat.text })
    }
  }
  return found
}

export function judgeFate(m: LifeMetrics): FateTitle {
  const exploreRate = m.explored / Math.max(1, m.stepsAlive / 40)
  const killRate = m.kills / Math.max(1, m.stepsAlive / 80)
  const restRate = m.rests / Math.max(1, m.stepsAlive / 100)

  if (m.level >= 12 && m.kills >= 20) {
    return {
      id: 'emberlord',
      title: '餘燼冠名者',
      epitaph: '野原終於肯用完整句子稱呼你。灰燼為你讓路。',
    }
  }
  if (m.crystalKills >= 4) {
    return {
      id: 'skinseam',
      title: '縫星者',
      epitaph: '你用戰鬥把碎掉的天空縫回袖口，走的時候還在發光。',
    }
  }
  if (m.wolfKills >= 5) {
    return {
      id: 'wolfcounter',
      title: '與狼合聲',
      epitaph: '夜曲沒停。你只是換成主唱。',
    }
  }
  if (exploreRate > 0.9 && m.explored >= 30 && killRate < 0.35) {
    return {
      id: 'mapwalker',
      title: '腳底板製圖師',
      epitaph: '打過的仗不多，却把未知走成可讀的線。',
    }
  }
  if (restRate > 0.8 && m.rests >= 10) {
    return {
      id: 'softash',
      title: '溫灰長者',
      epitaph: '你把存活鍛造成儀式。野原記得你的每一次躺下。',
    }
  }
  if (killRate > 0.7 && m.kills >= 12) {
    return {
      id: 'greenbutcher',
      title: '青苔屠夫',
      epitaph: '頁面濺滿綠與紅。女神寫快了些，沒有塗改。',
    }
  }
  if (m.level <= 2 && m.stepsAlive < 200) {
    return {
      id: 'briefspark',
      title: '短焰',
      epitaph: '亮一下就熄。仍算活過。',
    }
  }
  return {
    id: 'ordinaryember',
    title: '普通餘燼',
    epitaph: '不大聲，也不肯缺席。野原收下了這一世。',
  }
}

export function closingLines(lifeName: string, fate: FateTitle, m: LifeMetrics): string[] {
  return [
    `閉卷｜${lifeName}被記下為「${fate.title}」。`,
    fate.epitaph,
    `結算：Lv.${m.level} · 擊殺 ${m.kills} · 探索 ${m.explored} · 步數 ${m.stepsAlive} · 休憩 ${m.rests}`,
  ]
}

export function getChapterById(id: ChapterId): ChapterDef {
  return CHAPTERS.find((c) => c.id === id) ?? CHAPTERS[0]!
}
