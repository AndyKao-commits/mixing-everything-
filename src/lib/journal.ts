export type JournalKind = 'note' | 'recipe'

export type JournalEntry = {
  id: string
  kind: JournalKind
  text: string
  createdAt: number
  title?: string
  sourceUrl?: string
  ingredients?: string[]
  steps?: string[]
  notes?: string[]
}

export const JOURNAL_KEY = 'mixing-journal-v1'

export function normalizeEntry(raw: unknown): JournalEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<JournalEntry> & { text?: string; createdAt?: number; id?: string }
  if (!item.id || typeof item.text !== 'string' || typeof item.createdAt !== 'number') return null

  const kind: JournalKind = item.kind === 'recipe' ? 'recipe' : 'note'
  return {
    id: item.id,
    kind,
    text: item.text,
    createdAt: item.createdAt,
    title: typeof item.title === 'string' ? item.title : undefined,
    sourceUrl: typeof item.sourceUrl === 'string' ? item.sourceUrl : undefined,
    ingredients: Array.isArray(item.ingredients) ? item.ingredients.filter((x) => typeof x === 'string') : undefined,
    steps: Array.isArray(item.steps) ? item.steps.filter((x) => typeof x === 'string') : undefined,
    notes: Array.isArray(item.notes) ? item.notes.filter((x) => typeof x === 'string') : undefined,
  }
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
