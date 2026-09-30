'use client'

const PLAYER_TOKEN = 'bbq_player_token'
const PLAYER_ID = 'bbq_player_id'
const PLAYER_NAME = 'bbq_player_name'
const ADMIN_TOKEN = 'bbq_admin_token'

export function getPlayerToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(PLAYER_TOKEN)
}

export function setPlayerSession(token: string, playerId: string, name: string) {
  localStorage.setItem(PLAYER_TOKEN, token)
  localStorage.setItem(PLAYER_ID, playerId)
  localStorage.setItem(PLAYER_NAME, name)
}

export function clearPlayerSession() {
  localStorage.removeItem(PLAYER_TOKEN)
  localStorage.removeItem(PLAYER_ID)
  localStorage.removeItem(PLAYER_NAME)
}

export function getStoredPlayer() {
  if (typeof window === 'undefined') return null
  const id = localStorage.getItem(PLAYER_ID)
  const name = localStorage.getItem(PLAYER_NAME)
  const token = localStorage.getItem(PLAYER_TOKEN)
  if (!id || !name || !token) return null
  return { id, name, token }
}

export function getAdminToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_TOKEN)
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN, token)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN)
}
