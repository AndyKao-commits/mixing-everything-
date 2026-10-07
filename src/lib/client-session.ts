'use client'

const PLAYER_TOKEN = 'bbq_player_token'
const ADMIN_TOKEN = 'bbq_admin_token'
const TEST_TOKEN = 'bbq_test_access_token'

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


export function getTestAccessToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TEST_TOKEN)
}

export function setTestAccessToken(token: string) {
  localStorage.setItem(TEST_TOKEN, token)
}

export function clearTestAccessToken() {
  localStorage.removeItem(TEST_TOKEN)
}
