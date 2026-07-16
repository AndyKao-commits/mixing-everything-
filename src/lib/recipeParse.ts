export type ParsedRecipe = {
  title: string
  ingredients: string[]
  steps: string[]
  notes: string[]
}

const INGREDIENT_HEADERS =
  /^(材料|食材|配料|用料|ingredients?|what\s*you\s*need)\s*[:：]?$/i
const STEP_HEADERS =
  /^(步驟|做法|料理步驟|烹調步驟|作法|instructions?|directions?|method|steps?)\s*[:：]?$/i
const NOTE_HEADERS = /^(備註|小提醒|tips?|notes?)\s*[:：]?$/i
const TITLE_HINT = /^(食譜|菜名|title)\s*[:：]\s*(.+)$/i

const BULLET = /^[-•*·▪○●]\s*/
const NUMBERED = /^(?:\d+|[一二三四五六七八九十]+)[.．、)]\s*/
const QUANTITY =
  /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|公克|克|公斤|毫升|公升|大匙|小匙|茶匙|湯匙|杯|碗|顆|粒|片|條|根|把|球|罐|包|適量)/i

function cleanLine(line: string) {
  return line.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function stripMarker(line: string) {
  return line.replace(BULLET, '').replace(NUMBERED, '').trim()
}

function looksLikeIngredient(line: string) {
  const text = stripMarker(line)
  if (!text || text.length > 80) return false
  if (QUANTITY.test(text)) return true
  if (/^[^。！？!?]{1,40}$/.test(text) && /[、，,]/.test(text) === false) return true
  return /適量|少許|數[片顆粒]/.test(text)
}

function looksLikeStep(line: string) {
  const text = stripMarker(line)
  if (!text) return false
  if (NUMBERED.test(line)) return true
  if (text.length >= 8 && /[，。！？、]/.test(text)) return true
  return /下鍋|加熱|攪拌|煎|炒|煮|烤|蒸|拌勻|備用|盛起|加入|放入/.test(text)
}

/**
 * Turn pasted caption / transcript text into structured recipe fields.
 * Designed for Chinese cooking Reels captions and common recipe paste formats.
 */
export function parseRecipeFromText(raw: string, fallbackTitle = '未命名食譜'): ParsedRecipe {
  const lines = raw
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean)

  let title = fallbackTitle
  let titleLocked = false
  let mode: 'auto' | 'ingredients' | 'steps' | 'notes' = 'auto'
  const ingredients: string[] = []
  const steps: string[] = []
  const notes: string[] = []
  const unlabeled: string[] = []

  for (const line of lines) {
    const titleMatch = line.match(TITLE_HINT)
    if (titleMatch?.[2]) {
      title = titleMatch[2].trim()
      titleLocked = true
      continue
    }

    if (INGREDIENT_HEADERS.test(line)) {
      mode = 'ingredients'
      continue
    }
    if (STEP_HEADERS.test(line)) {
      mode = 'steps'
      continue
    }
    if (NOTE_HEADERS.test(line)) {
      mode = 'notes'
      continue
    }

    // Hashtag / CTA noise common in Reels
    if (/^#/.test(line) || /留言[「『"]?我要/.test(line) || /^@/.test(line)) {
      continue
    }

    const item = stripMarker(line)
    if (!item) continue

    if (mode === 'ingredients') {
      ingredients.push(item)
      continue
    }
    if (mode === 'steps') {
      steps.push(item)
      continue
    }
    if (mode === 'notes') {
      notes.push(item)
      continue
    }

    unlabeled.push(line)
  }

  // Prefer first short prose line as title when still default
  if (!titleLocked && title === fallbackTitle) {
    const candidate = unlabeled.find(
      (line) =>
        !BULLET.test(line) &&
        !NUMBERED.test(line) &&
        line.length >= 4 &&
        line.length <= 40 &&
        !QUANTITY.test(line),
    )
    if (candidate) {
      title = stripMarker(candidate)
      titleLocked = true
    }
  }

  const leftovers = titleLocked
    ? unlabeled.filter((line) => stripMarker(line) !== title)
    : unlabeled

  if (ingredients.length === 0 || steps.length === 0) {
    for (const line of leftovers) {
      const item = stripMarker(line)
      if (!item) continue
      if (ingredients.length === 0 && looksLikeIngredient(line) && !looksLikeStep(line)) {
        ingredients.push(item)
      } else if (looksLikeStep(line)) {
        steps.push(item)
      } else if (looksLikeIngredient(line)) {
        ingredients.push(item)
      } else if (item.length > 12) {
        steps.push(item)
      } else {
        ingredients.push(item)
      }
    }
  } else {
    for (const line of leftovers) {
      const item = stripMarker(line)
      if (!item) continue
      if (looksLikeIngredient(line) && !looksLikeStep(line)) ingredients.push(item)
      else if (looksLikeStep(line)) steps.push(item)
      else notes.push(item)
    }
  }

  return {
    title,
    ingredients: unique(ingredients.filter((item) => item !== title)),
    steps: unique(steps.filter((item) => item !== title)),
    notes: unique(notes.filter((item) => item !== title)),
  }
}

function unique(items: string[]) {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

export function detectPlatform(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('instagram')) return 'Instagram'
    if (host.includes('tiktok')) return 'TikTok'
    if (host.includes('youtube') || host === 'youtu.be') return 'YouTube'
    if (host.includes('facebook')) return 'Facebook'
    return host
  } catch {
    return '連結'
  }
}

export function formatRecipeJournalText(input: {
  title: string
  sourceUrl: string
  ingredients: string[]
  steps: string[]
  notes?: string[]
}): string {
  const platform = detectPlatform(input.sourceUrl)
  const lines = [
    `【食譜】${input.title}`,
    `來源（${platform}）：${input.sourceUrl}`,
    '',
    '材料',
    ...(input.ingredients.length ? input.ingredients.map((item) => `· ${item}`) : ['· （尚未填寫）']),
    '',
    '步驟',
    ...(input.steps.length
      ? input.steps.map((item, index) => `${index + 1}. ${item}`)
      : ['1. （尚未填寫）']),
  ]

  if (input.notes?.length) {
    lines.push('', '備註', ...input.notes.map((item) => `· ${item}`))
  }

  return lines.join('\n')
}
