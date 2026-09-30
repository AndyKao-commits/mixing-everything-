'use client'

function errorMessage(data: any, status: number, fallback = '請求失敗') {
  const raw =
    (typeof data?.error === 'string' && data.error) ||
    (typeof data?.error?.message === 'string' && data.error.message) ||
    (typeof data?.message === 'string' && data.message) ||
    ''

  const text = String(raw || '')
  if (
    status === 401 ||
    /protected deployment|vercel authentication|vercel_auth/i.test(text) ||
    data?.protection?.vercel_auth_enabled
  ) {
    return 'Vercel 預覽站需要先通過驗證。請重新整理並完成 Vercel 登入後再試；若要給賓客使用，請在 Vercel 專案關閉 Deployment Protection。'
  }
  if (text) return text
  if (status) return `${fallback}（HTTP ${status}）`
  return fallback
}

async function req<T>(url: string, init?: RequestInit, retriesLeft = 3): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      redirect: 'manual',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    })
  } catch {
    throw new Error('無法連線到伺服器，請檢查網路後重試')
  }

  // Vercel Deployment Protection often 302s unauthenticated API calls.
  if (res.type === 'opaqueredirect' || (res.status >= 300 && res.status < 400)) {
    throw new Error(
      'Vercel 預覽站需要先通過驗證。請重新整理並完成 Vercel 登入後再試；若要給賓客使用，請在 Vercel 專案關閉 Deployment Protection。',
    )
  }

  const data = await res.json().catch(() => ({}))
  if (res.status === 409 && retriesLeft > 0) {
    await new Promise((resolve) => setTimeout(resolve, 160 + (3 - retriesLeft) * 140 + Math.random() * 220))
    return req<T>(url, init, retriesLeft - 1)
  }
  if (!res.ok) throw new Error(errorMessage(data, res.status))
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
  finalReady: (token: string) =>
    req<any>('/api/games/final-button/ready', {
      method: 'POST',
      headers: { 'x-player-token': token },
    }),
  finalFinish: (token: string) =>
    req<any>('/api/games/final-button/finish', {
      method: 'POST',
      headers: { 'x-player-token': token },
    }),
  finalClick: (token: string, clientTs: number, clickCount = 0) =>
    req<any>('/api/games/final-button/click', {
      method: 'POST',
      headers: { 'x-player-token': token },
      body: JSON.stringify({ clientTs, clickCount }),
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
