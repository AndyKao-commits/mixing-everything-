import { getQuestionById, PERFECT_MAN_QUESTIONS } from '@/data/perfect-man-questions'
import {
  DEFAULT_CATEGORIES,
  HOST_OFFLINE_MS,
  nowIso,
  pickAvatar,
  randomRoomCode,
  ROOM_TTL_MS,
  SPEED_MODE_SECONDS,
  uid,
} from '@/lib/constants'
import type { Answer, GameSession, PerfectManMode, Question, QuestionCategory, RoomSnapshot } from '@/types/game'
import type { Player } from '@/types/player'
import type { Room } from '@/types/room'

interface StoreData {
  rooms: Map<string, Room>
  roomsByCode: Map<string, string>
  players: Map<string, Player>
  sessions: Map<string, GameSession>
  answers: Map<string, Answer>
}

const globalStore = globalThis as typeof globalThis & {
  __partyStore?: StoreData
}

function getStore(): StoreData {
  if (!globalStore.__partyStore) {
    globalStore.__partyStore = {
      rooms: new Map(),
      roomsByCode: new Map(),
      players: new Map(),
      sessions: new Map(),
      answers: new Map(),
    }
  }
  return globalStore.__partyStore
}

function touchRoom(room: Room) {
  const now = nowIso()
  room.updated_at = now
  room.last_activity_at = now
}

function playersInRoom(roomId: string): Player[] {
  const store = getStore()
  return [...store.players.values()]
    .filter((p) => p.room_id === roomId)
    .sort((a, b) => a.joined_at.localeCompare(b.joined_at))
}

function sessionForRoom(roomId: string): GameSession | null {
  const store = getStore()
  const sessions = [...store.sessions.values()]
    .filter((s) => s.room_id === roomId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  return sessions[0] ?? null
}

function answersForSession(sessionId: string, questionId?: string | null): Answer[] {
  const store = getStore()
  return [...store.answers.values()].filter((a) => {
    if (a.session_id !== sessionId) return false
    if (questionId && a.question_id !== questionId) return false
    return true
  })
}

function buildSnapshot(room: Room, viewerId?: string): RoomSnapshot {
  const players = playersInRoom(room.id)
  const session = sessionForRoom(room.id)
  const currentQuestion = session?.current_question_id
    ? getQuestionById(session.current_question_id)
    : null
  let answers = session ? answersForSession(session.id, session.current_question_id) : []

  // Keep scores hidden until everyone has answered / time is up.
  if (session?.status === 'answering') {
    answers = answers.map((answer) => {
      if (viewerId && answer.player_id === viewerId) return answer
      return {
        ...answer,
        score: 0,
        // Marker so clients can count submissions without seeing values.
      }
    })
  }

  return { room, players, session, answers, currentQuestion }
}

function transferHostIfNeeded(room: Room, players: Player[]) {
  if (players.length === 0) {
    room.host_id = null
    return null
  }

  const host = players.find((p) => p.id === room.host_id) ?? null
  const now = Date.now()
  const hostOffline =
    !host || now - new Date(host.last_seen_at).getTime() > HOST_OFFLINE_MS

  if (!hostOffline && host) {
    players.forEach((p) => {
      p.is_host = p.id === host.id
    })
    return null
  }

  const nextHost = players[0]
  room.host_id = nextHost.id
  players.forEach((p) => {
    p.is_host = p.id === nextHost.id
  })
  touchRoom(room)
  return nextHost
}

function cleanupStaleRooms() {
  const store = getStore()
  const now = Date.now()
  for (const room of store.rooms.values()) {
    const players = playersInRoom(room.id)
    const emptyFor =
      players.length === 0 ? now - new Date(room.last_activity_at).getTime() : 0
    if (players.length === 0 && emptyFor > ROOM_TTL_MS) {
      deleteRoom(room.id)
    }
  }
}

function deleteRoom(roomId: string) {
  const store = getStore()
  const room = store.rooms.get(roomId)
  if (!room) return
  store.roomsByCode.delete(room.code)
  store.rooms.delete(roomId)
  for (const [id, player] of store.players) {
    if (player.room_id === roomId) store.players.delete(id)
  }
  for (const [id, session] of store.sessions) {
    if (session.room_id === roomId) {
      for (const [aid, answer] of store.answers) {
        if (answer.session_id === id) store.answers.delete(aid)
      }
      store.sessions.delete(id)
    }
  }
}

function assertHost(room: Room, playerId: string) {
  if (room.host_id !== playerId) {
    throw new Error('只有房主可以操作')
  }
}

function pickQuestion(
  mode: PerfectManMode,
  categories: QuestionCategory[],
  used: string[],
): Question {
  const questionMode = mode === 'reverse' ? 'reverse' : 'classic'
  const pool = PERFECT_MAN_QUESTIONS.filter(
    (q) =>
      q.enabled &&
      q.mode === questionMode &&
      categories.includes(q.category) &&
      !used.includes(q.id),
  )
  const fallback = PERFECT_MAN_QUESTIONS.filter(
    (q) => q.enabled && q.mode === questionMode && categories.includes(q.category),
  )
  const list = pool.length > 0 ? pool : fallback
  if (list.length === 0) {
    throw new Error('沒有可用題目')
  }
  return list[Math.floor(Math.random() * list.length)]
}

function maybeReveal(session: GameSession, room: Room) {
  if (session.status !== 'answering' || !session.current_question_id) return
  const players = playersInRoom(room.id)
  const answers = answersForSession(session.id, session.current_question_id)
  const answeredIds = new Set(answers.map((a) => a.player_id))
  const allAnswered = players.every((p) => answeredIds.has(p.id))

  const deadlinePassed =
    session.answering_deadline &&
    Date.now() >= new Date(session.answering_deadline).getTime()

  if (!allAnswered && !deadlinePassed) return

  if (deadlinePassed) {
    for (const player of players) {
      if (!answeredIds.has(player.id)) {
        const miss: Answer = {
          id: uid(),
          session_id: session.id,
          question_id: session.current_question_id,
          player_id: player.id,
          score: 0,
          submitted_at: nowIso(),
          missed: true,
        }
        getStore().answers.set(miss.id, miss)
      }
    }
  }

  // Jump straight into reveal + discussion for the party punchline.
  session.status = 'discussion'
  session.answering_deadline = null
  session.updated_at = nowIso()
  touchRoom(room)
}

export const partyStore = {
  createRoom(nickname: string, playerId?: string) {
    cleanupStaleRooms()
    const store = getStore()
    const now = nowIso()
    let code = randomRoomCode(4)
    while (store.roomsByCode.has(code)) {
      code = randomRoomCode(Math.random() > 0.7 ? 5 : 4)
    }

    const roomId = uid()
    const pid = playerId || uid()
    const room: Room = {
      id: roomId,
      code,
      host_id: pid,
      status: 'lobby',
      selected_game_id: null,
      created_at: now,
      updated_at: now,
      last_activity_at: now,
    }
    const player: Player = {
      id: pid,
      room_id: roomId,
      nickname: nickname.trim().slice(0, 12) || '玩家',
      avatar: pickAvatar(pid),
      is_host: true,
      joined_at: now,
      last_seen_at: now,
    }

    store.rooms.set(roomId, room)
    store.roomsByCode.set(code, roomId)
    store.players.set(pid, player)
    return buildSnapshot(room, pid)
  },

  joinRoom(code: string, nickname: string, playerId?: string) {
    cleanupStaleRooms()
    const store = getStore()
    const roomId = store.roomsByCode.get(code.trim())
    if (!roomId) throw new Error('找不到這個房間')
    const room = store.rooms.get(roomId)
    if (!room) throw new Error('找不到這個房間')

    const existingPlayers = playersInRoom(roomId)
    if (existingPlayers.length >= 12) throw new Error('房間已滿')

    const now = nowIso()
    const pid = playerId || uid()
    const existing = store.players.get(pid)

    if (existing && existing.room_id === roomId) {
      existing.nickname = nickname.trim().slice(0, 12) || existing.nickname
      existing.last_seen_at = now
      touchRoom(room)
      transferHostIfNeeded(room, playersInRoom(roomId))
      return buildSnapshot(room, pid)
    }

    // Leaving previous room if any
    if (existing) {
      this.leaveRoom(existing.room_id, pid)
    }

    const player: Player = {
      id: pid,
      room_id: roomId,
      nickname: nickname.trim().slice(0, 12) || '玩家',
      avatar: pickAvatar(pid),
      is_host: false,
      joined_at: now,
      last_seen_at: now,
    }
    store.players.set(pid, player)
    touchRoom(room)
    transferHostIfNeeded(room, playersInRoom(roomId))
    return buildSnapshot(room, pid)
  },

  leaveRoom(roomId: string, playerId: string) {
    const store = getStore()
    const room = store.rooms.get(roomId)
    store.players.delete(playerId)
    if (!room) return null
    const players = playersInRoom(roomId)
    if (players.length === 0) {
      touchRoom(room)
      room.host_id = null
      return buildSnapshot(room)
    }
    transferHostIfNeeded(room, players)
    touchRoom(room)
    return buildSnapshot(room)
  },

  heartbeat(roomCode: string, playerId: string) {
    const store = getStore()
    const roomId = store.roomsByCode.get(roomCode)
    if (!roomId) throw new Error('找不到這個房間')
    const room = store.rooms.get(roomId)
    if (!room) throw new Error('找不到這個房間')
    const player = store.players.get(playerId)
    if (!player || player.room_id !== roomId) {
      throw new Error('你不在這個房間')
    }
    player.last_seen_at = nowIso()
    const transferred = transferHostIfNeeded(room, playersInRoom(roomId))
    const session = sessionForRoom(roomId)
    if (session) maybeReveal(session, room)
    const snapshot = buildSnapshot(room, playerId)
    return { snapshot, hostTransferredTo: transferred?.nickname ?? null }
  },

  getSnapshot(code: string, viewerId?: string): RoomSnapshot {
    const store = getStore()
    const roomId = store.roomsByCode.get(code)
    if (!roomId) throw new Error('找不到這個房間')
    const room = store.rooms.get(roomId)
    if (!room) throw new Error('找不到這個房間')
    const session = sessionForRoom(roomId)
    if (session) maybeReveal(session, room)
    transferHostIfNeeded(room, playersInRoom(roomId))
    return buildSnapshot(room, viewerId)
  },

  selectGame(code: string, playerId: string, gameId: string) {
    const store = getStore()
    const room = this.getRoomByCode(code)
    assertHost(room, playerId)
    if (gameId !== 'perfect_man') throw new Error('遊戲尚未開放')

    room.selected_game_id = gameId
    room.status = 'playing'
    touchRoom(room)

    const now = nowIso()
    const session: GameSession = {
      id: uid(),
      room_id: room.id,
      game_id: 'perfect_man',
      mode: 'classic',
      status: 'mode_select',
      round: 0,
      current_question_id: null,
      categories: [...DEFAULT_CATEGORIES],
      used_question_ids: [],
      answering_deadline: null,
      created_at: now,
      updated_at: now,
    }
    store.sessions.set(session.id, session)
    return buildSnapshot(room, playerId)
  },

  configurePerfectMan(
    code: string,
    playerId: string,
    mode: PerfectManMode,
    categories: QuestionCategory[],
  ) {
    const room = this.getRoomByCode(code)
    assertHost(room, playerId)
    const session = sessionForRoom(room.id)
    if (!session) throw new Error('尚未開始遊戲')
    session.mode = mode
    session.categories = categories.length ? categories : [...DEFAULT_CATEGORIES]
    session.status = 'question'
    session.updated_at = nowIso()
    touchRoom(room)
    return buildSnapshot(room, playerId)
  },

  startQuestion(code: string, playerId: string) {
    const room = this.getRoomByCode(code)
    assertHost(room, playerId)
    const session = sessionForRoom(room.id)
    if (!session) throw new Error('尚未開始遊戲')

    const question = pickQuestion(session.mode, session.categories, session.used_question_ids)
    session.current_question_id = question.id
    session.used_question_ids = [...session.used_question_ids, question.id]
    session.round += 1
    session.status = 'answering'
    session.answering_deadline =
      session.mode === 'speed'
        ? new Date(Date.now() + SPEED_MODE_SECONDS * 1000).toISOString()
        : null
    session.updated_at = nowIso()
    touchRoom(room)
    return buildSnapshot(room, playerId)
  },

  submitAnswer(code: string, playerId: string, score: number) {
    const store = getStore()
    const room = this.getRoomByCode(code)
    const player = store.players.get(playerId)
    if (!player || player.room_id !== room.id) throw new Error('你不在這個房間')
    const session = sessionForRoom(room.id)
    if (!session || !session.current_question_id) throw new Error('目前沒有題目')
    if (session.status !== 'answering') throw new Error('現在不能作答')

    if (
      session.answering_deadline &&
      Date.now() > new Date(session.answering_deadline).getTime()
    ) {
      throw new Error('來不及了')
    }

    const existing = answersForSession(session.id, session.current_question_id).find(
      (a) => a.player_id === playerId,
    )
    if (existing) throw new Error('你已經回答過了')

    const clamped = Math.max(-5, Math.min(15, Math.round(score)))
    const answer: Answer = {
      id: uid(),
      session_id: session.id,
      question_id: session.current_question_id,
      player_id: playerId,
      score: clamped,
      submitted_at: nowIso(),
    }
    store.answers.set(answer.id, answer)
    player.last_seen_at = nowIso()
    maybeReveal(session, room)
    touchRoom(room)
    return buildSnapshot(room, playerId)
  },

  revealNow(code: string, playerId: string) {
    const room = this.getRoomByCode(code)
    assertHost(room, playerId)
    const session = sessionForRoom(room.id)
    if (!session) throw new Error('尚未開始遊戲')
    if (session.status === 'answering') {
      session.answering_deadline = nowIso()
      maybeReveal(session, room)
    }
    if (session.status === 'result') {
      session.status = 'discussion'
      session.updated_at = nowIso()
      touchRoom(room)
    }
    return buildSnapshot(room, playerId)
  },

  toDiscussion(code: string, playerId: string) {
    const room = this.getRoomByCode(code)
    assertHost(room, playerId)
    const session = sessionForRoom(room.id)
    if (!session) throw new Error('尚未開始遊戲')
    if (session.status !== 'result' && session.status !== 'discussion') {
      throw new Error('尚未公布結果')
    }
    session.status = 'discussion'
    session.updated_at = nowIso()
    touchRoom(room)
    return buildSnapshot(room, playerId)
  },

  nextQuestion(code: string, playerId: string) {
    const room = this.getRoomByCode(code)
    assertHost(room, playerId)
    const session = sessionForRoom(room.id)
    if (!session) throw new Error('尚未開始遊戲')
    session.status = 'question'
    session.current_question_id = null
    session.answering_deadline = null
    session.updated_at = nowIso()
    touchRoom(room)
    return buildSnapshot(room, playerId)
  },

  backToLobby(code: string, playerId: string) {
    const store = getStore()
    const room = this.getRoomByCode(code)
    assertHost(room, playerId)
    const session = sessionForRoom(room.id)
    if (session) {
      for (const [id, answer] of store.answers) {
        if (answer.session_id === session.id) store.answers.delete(id)
      }
      store.sessions.delete(session.id)
    }
    room.selected_game_id = null
    room.status = 'lobby'
    touchRoom(room)
    return buildSnapshot(room, playerId)
  },

  getRoomByCode(code: string): Room {
    const store = getStore()
    const roomId = store.roomsByCode.get(code)
    if (!roomId) throw new Error('找不到這個房間')
    const room = store.rooms.get(roomId)
    if (!room) throw new Error('找不到這個房間')
    return room
  },
}
