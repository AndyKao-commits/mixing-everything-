import type { PerfectManMode, QuestionCategory, RoomSnapshot } from '@/types/game'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || '請求失敗')
  }
  return data as T
}

export const partyApi = {
  createRoom(nickname: string, playerId: string) {
    return request<{ snapshot: RoomSnapshot }>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify({ nickname, playerId }),
    })
  },

  joinRoom(code: string, nickname: string, playerId: string) {
    return request<{ snapshot: RoomSnapshot }>(`/api/rooms/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ nickname, playerId }),
    })
  },

  getRoom(code: string) {
    return request<{ snapshot: RoomSnapshot }>(`/api/rooms/${code}`)
  },

  heartbeat(code: string, playerId: string) {
    return request<{ snapshot: RoomSnapshot; hostTransferredTo: string | null }>(
      `/api/rooms/${code}/heartbeat`,
      {
        method: 'POST',
        body: JSON.stringify({ playerId }),
      },
    )
  },

  selectGame(code: string, playerId: string, gameId: string) {
    return request<{ snapshot: RoomSnapshot }>(`/api/rooms/${code}/select-game`, {
      method: 'POST',
      body: JSON.stringify({ playerId, gameId }),
    })
  },

  configurePerfectMan(
    code: string,
    playerId: string,
    mode: PerfectManMode,
    categories: QuestionCategory[],
  ) {
    return request<{ snapshot: RoomSnapshot }>(`/api/rooms/${code}/perfect-man/config`, {
      method: 'POST',
      body: JSON.stringify({ playerId, mode, categories }),
    })
  },

  startQuestion(code: string, playerId: string) {
    return request<{ snapshot: RoomSnapshot }>(`/api/rooms/${code}/perfect-man/start`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    })
  },

  submitAnswer(code: string, playerId: string, score: number) {
    return request<{ snapshot: RoomSnapshot }>(`/api/rooms/${code}/perfect-man/answer`, {
      method: 'POST',
      body: JSON.stringify({ playerId, score }),
    })
  },

  toDiscussion(code: string, playerId: string) {
    return request<{ snapshot: RoomSnapshot }>(`/api/rooms/${code}/perfect-man/discuss`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    })
  },

  nextQuestion(code: string, playerId: string) {
    return request<{ snapshot: RoomSnapshot }>(`/api/rooms/${code}/perfect-man/next`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    })
  },

  backToLobby(code: string, playerId: string) {
    return request<{ snapshot: RoomSnapshot }>(`/api/rooms/${code}/back-to-lobby`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    })
  },
}
