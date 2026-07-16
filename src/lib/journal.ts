export type JournalEntry = {
  id: string
  text: string
  createdAt: number
}

export const JOURNAL_KEY = 'mixing-journal-v1'

export function normalizeEntry(raw: unknown): JournalEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<JournalEntry> & {
    kind?: string
    title?: string
    ingredients?: string[]
    steps?: string[]
  }
  if (!item.id || typeof item.createdAt !== 'number') return null

  if (typeof item.text === 'string' && item.text.trim()) {
    return { id: item.id, text: item.text, createdAt: item.createdAt }
  }

  // 舊版食譜日誌：盡量轉成純文字顯示
  if (item.kind === 'recipe') {
    const lines = [
      item.title ? `【食譜】${item.title}` : '【食譜】',
      ...(item.ingredients || []).map((line) => `· ${line}`),
      ...(item.steps || []).map((line, index) => `${index + 1}. ${line}`),
    ].filter(Boolean)
    if (lines.length) {
      return { id: item.id, text: lines.join('\n'), createdAt: item.createdAt }
    }
  }

  return null
}

export function loadJournalEntries(): JournalEntry[] {
  try {
    const raw = window.localStorage.getItem(JOURNAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeEntry).filter((entry): entry is JournalEntry => Boolean(entry))
  } catch {
    return []
  }
}

export function saveJournalEntries(entries: JournalEntry[]) {
  window.localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries))
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}
