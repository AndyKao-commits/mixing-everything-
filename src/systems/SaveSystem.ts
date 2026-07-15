import type { Player } from '@/types/game'
import { createPlayer } from '@/utils/playerFactory'
import { ensureQuests } from '@/systems/QuestSystem'

const SAVE_KEY = 'goblin-raid-remastered-v2'
const SAVE_VERSION = 2

export type SaveBlob = {
  version: number
  player: Player
  savedAt: number
}

export function savePlayer(player: Player) {
  const blob: SaveBlob = {
    version: SAVE_VERSION,
    player: { ...player, lastSaveAt: Date.now() },
    savedAt: Date.now(),
  }
  if (typeof window === 'undefined') return blob
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(blob))
  return blob
}

export function loadPlayer(): { player: Player; offlineMs: number } {
  if (typeof window === 'undefined') {
    return { player: ensureQuests(createPlayer()), offlineMs: 0 }
  }
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return { player: ensureQuests(createPlayer()), offlineMs: 0 }
    const parsed = JSON.parse(raw) as SaveBlob
    if (!parsed?.player || parsed.version !== SAVE_VERSION) {
      return { player: ensureQuests(createPlayer()), offlineMs: 0 }
    }
    const offlineMs = Math.max(0, Date.now() - (parsed.player.lastSaveAt || parsed.savedAt || Date.now()))
    const player = ensureQuests({
      ...parsed.player,
      heroSkin: parsed.player.heroSkin || 'default',
    })
    return { player, offlineMs }
  } catch {
    return { player: ensureQuests(createPlayer()), offlineMs: 0 }
  }
}

export function clearSave() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SAVE_KEY)
}

export function exportSave(player: Player) {
  return JSON.stringify(savePlayer(player), null, 2)
}

export function importSave(raw: string): Player | null {
  try {
    const parsed = JSON.parse(raw) as SaveBlob
    if (!parsed?.player) return null
    savePlayer(parsed.player)
    return ensureQuests(parsed.player)
  } catch {
    return null
  }
}
