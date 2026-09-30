'use client'

const PLAYER_KEY = 'party_room_player_id'
const ROOM_KEY = 'party_room_last_room'
const NICK_KEY = 'party_room_nickname'

export function getStoredPlayerId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(PLAYER_KEY)
}

export function ensurePlayerId(): string {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem(PLAYER_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(PLAYER_KEY, id)
  }
  return id
}

export function saveNickname(nickname: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(NICK_KEY, nickname)
}

export function getStoredNickname(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(NICK_KEY) || ''
}

export function saveLastRoom(code: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ROOM_KEY, code)
}

export function getLastRoom(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ROOM_KEY)
}

export function clearLastRoom() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ROOM_KEY)
}
