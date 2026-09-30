'use client'

const PLAYER_TOKEN = 'bbq_player_token'
const ADMIN_TOKEN = 'bbq_admin_token'

export function getPlayerToken() {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(PLAYER_TOKEN)
}

export function setPlayerSession(token: string) {
  sessionStorage.setItem(PLAYER_TOKEN, token)
}

export function clearPlayerSession() {
  sessionStorage.removeItem(PLAYER_TOKEN)
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
