'use client'

function errorMessage(data: any, fallback = '請求失敗') {
  if (!data) return fallback
  if (typeof data.error === 'string') return data.error
  if (typeof data.error?.message === 'string') return data.error.message
  if (typeof data.message === 'string') return data.message
  return fallback
}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(errorMessage(data))
  return data as T
}

export const api = {
  state: () => req<any>('/api/state'),
  setPin: (playerId: string, pin: string, confirm: string) =>
    req<any>('/api/auth/pin', {
      method: 'POST',
      body: JSON.stringify({ playerId, pin, confirm }),
    }),
  login: (playerId: string, pin: string) =>
    req<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ playerId, pin }),
    }),
  me: (token: string) =>
    req<any>('/api/me', { headers: { 'x-player-token': token } }),
  revealMystery: (token: string, cellId: string) =>
    req<any>('/api/bingo/reveal', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ cellId }),
    }),
  completeBingo: (token: string, cellId: string, photoDataUrl: string) =>
    req<any>('/api/bingo/complete', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ cellId, photoDataUrl }),
    }),
  completeSecret: (token: string) =>
    req<any>('/api/tasks/secret', {
      method: 'POST',
      headers: { 'x-player-token': token },
    }),
  completeTarget: (token: string) =>
    req<any>('/api/tasks/target', {
      method: 'POST',
      headers: { 'x-player-token': token },
    }),
  completeBounty: (token: string, bountyId: string) =>
    req<any>('/api/tasks/bounty', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ bountyId }),
    }),
  submitDontCopy: (token: string, text: string) =>
    req<any>('/api/games/dont-copy/answer', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ text }),
    }),
  submitWhoWrote: (token: string, text: string) =>
    req<any>('/api/games/who-wrote/answer', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ text }),
    }),
  voteWhoWrote: (token: string, guessedPlayerId: string) =>
    req<any>('/api/games/who-wrote/vote', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ guessedPlayerId }),
    }),
  finalClick: (token: string, clientTs: number) =>
    req<any>('/api/games/final-button/click', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ clientTs }),
    }),
  submitMessage: (token: string, text: string) =>
    req<any>('/api/messages', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ text }),
    }),
  decidePrize: (token: string, choice: 'keep' | 'donate') =>
    req<any>('/api/settlement/decide', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ choice }),
    }),
  adminLogin: (pin: string) =>
    req<any>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    }),
  adminState: (token: string) =>
    req<any>('/api/admin/state', { headers: { 'x-admin-token': token } }),
  adminAction: (token: string, action: string, payload: Record<string, unknown> = {}) =>
    req<any>('/api/admin/action', {
      method: 'POST',
      headers: { 'x-admin-token': token },
      body: JSON.stringify({ action, ...payload }),
    }),
}
