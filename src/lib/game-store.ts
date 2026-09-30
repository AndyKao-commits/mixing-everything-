import {
  CREATIVE_PROMPTS,
  FOOD_PROMPTS,
  MOMENT_PROMPTS,
  MYSTERY_PROMPTS,
  OBJECT_PROMPTS,
  PEOPLE_PROMPTS,
  type BingoPrompt,
} from '../data/bingo'
import {
  BOUNTY_TEMPLATES,
  DONT_COPY_PROMPTS,
  SECRET_TASK_TEMPLATES,
  TARGET_TASKS,
  WHO_WROTE_PROMPTS,
} from '../data/tasks'
import {
  hashPin,
  nowIso,
  signAdminToken,
  signPlayerToken,
  uid,
  verifyAdminToken,
  verifyPin,
  verifyPlayerToken,
} from './crypto'
import { persistGetPhoto, persistGetState, persistSetPhoto, persistSetState } from './persist'
import { computeBingoBonuses, totalScore } from './scoring'
import { buildTargetCycle } from './target-cycle'
import type {
  BingoCard,
  BingoCell,
  Bounty,
  Event,
  EventStatus,
  FinalMessage,
  GroupGame,
  GroupGameKind,
  Player,
  PlayerBounty,
  PlayerSession,
  PlayerTarget,
  PrizeDecision,
  PublicPlayer,
  ScoreSource,
  ScoreTransaction,
  SecretTask,
  Settlement,
} from '../types'

interface Store {
  event: Event | null
  players: Map<string, Player>
  sessions: Map<string, PlayerSession>
  scores: ScoreTransaction[]
  bingoCards: Map<string, BingoCard>
  secretTasks: Map<string, SecretTask>
  bounties: Bounty[]
  playerBounties: Map<string, PlayerBounty>
  targets: Map<string, PlayerTarget>
  groupGames: Map<string, GroupGame>
  messages: Map<string, FinalMessage>
  prizeDecisions: Map<string, PrizeDecision>
  settlement: Settlement | null
  finalClicks: Map<string, { count: number; lastAt: number; events: number[] }>
  mysteryUsed: Set<string>
  adminSessions: Set<string>
}

const g = globalThis as typeof globalThis & { __bbqStore?: Store }

function store(): Store {
  if (!g.__bbqStore) {
    g.__bbqStore = {
      event: null,
      players: new Map(),
      sessions: new Map(),
      scores: [],
      bingoCards: new Map(),
      secretTasks: new Map(),
      bounties: [],
      playerBounties: new Map(),
      targets: new Map(),
      groupGames: new Map(),
      messages: new Map(),
      prizeDecisions: new Map(),
      settlement: null,
      finalClicks: new Map(),
      mysteryUsed: new Set(),
      adminSessions: new Set(),
    }
  }
  return g.__bbqStore
}

function requireEvent(): Event {
  const event = store().event
  if (!event) throw new Error('尚未建立活動')
  return event
}

function touch(event: Event) {
  event.updated_at = nowIso()
}

function assertNotLocked(event: Event) {
  if (event.score_locked || event.status === 'score_locked' || event.status === 'settlement' || event.status === 'finished') {
    throw new Error('積分已鎖定，無法再計分')
  }
}

function addScore(
  event: Event,
  playerId: string,
  source_type: ScoreSource,
  source_id: string,
  points: number,
  note?: string,
) {
  assertNotLocked(event)
  if (points === 0) return
  // prevent duplicate source scoring
  const exists = store().scores.some(
    (s) =>
      s.event_id === event.id &&
      s.player_id === playerId &&
      s.source_type === source_type &&
      s.source_id === source_id,
  )
  if (exists) throw new Error('此項目已計過分')
  store().scores.push({
    id: uid(),
    event_id: event.id,
    player_id: playerId,
    source_type,
    source_id,
    points,
    note,
    created_at: nowIso(),
  })
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function takeUnique(prompts: BingoPrompt[], used: Set<string>, n: number): BingoPrompt[] {
  const pool = shuffle(prompts.filter((p) => !used.has(p.id)))
  const out: BingoPrompt[] = []
  const poolsTaken = new Set<string>()
  for (const p of pool) {
    if (out.length >= n) break
    if (p.pool && poolsTaken.has(p.pool)) continue
    out.push(p)
    used.add(p.id)
    if (p.pool) poolsTaken.add(p.pool)
  }
  while (out.length < n && prompts.length) {
    out.push(pick(prompts))
  }
  return out
}

function buildBingoCard(eventId: string, playerId: string, playerNames: string[]): BingoCard {
  const used = new Set<string>()
  const food = takeUnique(FOOD_PROMPTS, used, 2)
  const object = takeUnique(OBJECT_PROMPTS, used, 2)
  const people = takeUnique(PEOPLE_PROMPTS, used, 2)
  const moment = takeUnique(MOMENT_PROMPTS, used, 1)
  const creative = takeUnique(CREATIVE_PROMPTS, used, 1)
  const others = playerNames.filter((n) => n)
  const namedText = others.length
    ? `跟 ${pick(others)} 合照`
    : '跟指定玩家合照'
  const named: BingoPrompt = {
    id: `named_${uid()}`,
    category: 'named',
    text: namedText,
  }
  const mysteryPool = MYSTERY_PROMPTS.filter((p) => !store().mysteryUsed.has(p.id))
  const mysterySource = mysteryPool.length ? mysteryPool : MYSTERY_PROMPTS
  const mystery = takeUnique(mysterySource, store().mysteryUsed, 2)
  mystery.forEach((m) => store().mysteryUsed.add(m.id))

  const selected = shuffle([
    ...food,
    ...object,
    ...people,
    ...moment,
    ...creative,
    named,
    ...mystery,
  ]).slice(0, 9)

  while (selected.length < 9) {
    selected.push(pick(OBJECT_PROMPTS))
  }

  const cells: BingoCell[] = selected.map((p, index) => ({
    id: uid(),
    index,
    category: p.category,
    text: p.text,
    mystery: p.category === 'mystery',
    revealed: p.category !== 'mystery',
    photo_data_url: null,
    completed: false,
    completed_at: null,
  }))

  return {
    id: uid(),
    event_id: eventId,
    player_id: playerId,
    cells,
    line_bonuses: [],
    full_bonus: false,
  }
}

function ensurePlayerAssignments(event: Event) {
  const players = [...store().players.values()].filter((p) => p.event_id === event.id)
  if (players.length < 2) return

  for (const player of players) {
    if (![...store().bingoCards.values()].some((c) => c.player_id === player.id)) {
      const names = players.filter((p) => p.id !== player.id).map((p) => p.name)
      store().bingoCards.set(player.id, buildBingoCard(event.id, player.id, names))
    }
    if (![...store().secretTasks.values()].some((t) => t.player_id === player.id)) {
      const tpl = pick(SECRET_TASK_TEMPLATES)
      const others = players.filter((p) => p.id !== player.id)
      const target = tpl.needsTarget && others.length ? pick(others) : null
      const text = target ? tpl.text.replace('指定玩家', target.name) : tpl.text
      const task: SecretTask = {
        id: uid(),
        event_id: event.id,
        player_id: player.id,
        text,
        points: tpl.points,
        target_player_id: target?.id ?? null,
        completed: false,
        completed_at: null,
      }
      store().secretTasks.set(task.id, task)
    }
  }

  if (store().targets.size === 0 && players.length >= 2) {
    const pairs = buildTargetCycle(players.map((p) => p.id))
    for (const [from, to] of pairs) {
      const tpl = pick(TARGET_TASKS)
      const targetPlayer = store().players.get(to)!
      const row: PlayerTarget = {
        id: uid(),
        event_id: event.id,
        player_id: from,
        target_player_id: to,
        text: tpl.text.replace('目標', targetPlayer.name),
        points: tpl.points,
        completed: false,
        completed_at: null,
      }
      store().targets.set(from, row)
    }
  }

  if (store().bounties.length === 0) {
    store().bounties = shuffle(BOUNTY_TEMPLATES)
      .slice(0, 20)
      .map((b) => ({
        id: uid(),
        event_id: event.id,
        text: b.text,
        points: b.points,
      }))
  }
}

function publicPlayers(): PublicPlayer[] {
  return [...store().players.values()]
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map((p) => ({
      id: p.id,
      name: p.name,
      pin_set: p.pin_set,
      last_seen_at: p.last_seen_at,
    }))
}

function playerScore(playerId: string) {
  return totalScore(store().scores, playerId)
}

function rankings() {
  const event = requireEvent()
  return [...store().players.values()]
    .filter((p) => p.event_id === event.id)
    .map((p) => ({
      player_id: p.id,
      name: p.name,
      score: playerScore(p.id),
    }))
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
    .map((row, i) => ({ ...row, rank: i + 1 }))
}

function getSession(token?: string | null): PlayerSession | null {
  if (!token) return null
  const existing = [...store().sessions.values()].find((s) => s.token === token)
  if (existing) {
    if (new Date(existing.expires_at).getTime() < Date.now()) {
      store().sessions.delete(existing.id)
      return null
    }
    return existing
  }

  // Signed player tokens survive serverless cold starts / instance hops.
  const verified = verifyPlayerToken(token)
  if (!verified) return null
  const event = store().event
  if (!event) return null
  const session: PlayerSession = {
    id: uid(),
    event_id: event.id,
    player_id: verified.playerId,
    token,
    created_at: nowIso(),
    expires_at: new Date(verified.expiresAt).toISOString(),
  }
  store().sessions.set(session.id, session)
  return session
}

function requirePlayerSession(token?: string | null): { session: PlayerSession; player: Player } {
  const session = getSession(token)
  if (!session) throw new Error('請重新登入')
  const player = store().players.get(session.player_id)
  if (!player) throw new Error('玩家不存在')
  player.last_seen_at = nowIso()
  return { session, player }
}

function requireAdmin(token?: string | null) {
  if (!token) throw new Error('管理員未登入')
  if (verifyAdminToken(token) || store().adminSessions.has(token)) return true
  throw new Error('管理員未登入')
}

type SerializedStore = {
  event: Event | null
  players: Player[]
  sessions: PlayerSession[]
  scores: ScoreTransaction[]
  bingoCards: Array<Omit<BingoCard, 'cells'> & { cells: Array<Omit<BingoCell, 'photo_data_url'> & { photo_data_url: string | null; photo_ref?: string }> }>
  secretTasks: SecretTask[]
  bounties: Bounty[]
  playerBounties: PlayerBounty[]
  targets: Array<[string, PlayerTarget]>
  groupGames: GroupGame[]
  messages: FinalMessage[]
  prizeDecisions: PrizeDecision[]
  settlement: Settlement | null
  finalClicks: Array<[string, { count: number; lastAt: number; events: number[] }]>
  mysteryUsed: string[]
  adminSessions: string[]
  photoIds: string[]
}

function serializeStore(): SerializedStore {
  const photoIds: string[] = []
  const bingoCards = [...store().bingoCards.values()].map((card) => ({
    ...card,
    cells: card.cells.map((cell) => {
      if (cell.photo_data_url) {
        photoIds.push(cell.id)
        return { ...cell, photo_data_url: null, photo_ref: cell.id }
      }
      return { ...cell, photo_data_url: null }
    }),
  }))
  return {
    event: store().event,
    players: [...store().players.values()],
    sessions: [...store().sessions.values()],
    scores: store().scores,
    bingoCards,
    secretTasks: [...store().secretTasks.values()],
    bounties: store().bounties,
    playerBounties: [...store().playerBounties.values()],
    targets: [...store().targets.entries()],
    groupGames: [...store().groupGames.values()],
    messages: [...store().messages.values()],
    prizeDecisions: [...store().prizeDecisions.values()],
    settlement: store().settlement,
    finalClicks: [...store().finalClicks.entries()],
    mysteryUsed: [...store().mysteryUsed],
    adminSessions: [...store().adminSessions],
    photoIds,
  }
}

function hydrateStore(data: SerializedStore) {
  const next = store()
  next.event = data.event
  next.players = new Map((data.players || []).map((p) => [p.id, p]))
  next.sessions = new Map((data.sessions || []).map((s) => [s.id, s]))
  next.scores = data.scores || []
  next.bingoCards = new Map(
    (data.bingoCards || []).map((card) => [
      card.player_id,
      {
        ...card,
        cells: card.cells.map((cell) => ({
          ...cell,
          photo_data_url: cell.photo_data_url,
        })),
      },
    ]),
  )
  next.secretTasks = new Map((data.secretTasks || []).map((t) => [t.id, t]))
  next.bounties = data.bounties || []
  next.playerBounties = new Map((data.playerBounties || []).map((pb) => [pb.id, pb]))
  next.targets = new Map(data.targets || [])
  next.groupGames = new Map((data.groupGames || []).map((g) => [g.id, g]))
  next.messages = new Map((data.messages || []).map((m) => [m.id, m]))
  next.prizeDecisions = new Map((data.prizeDecisions || []).map((d) => [d.player_id, d]))
  next.settlement = data.settlement
  next.finalClicks = new Map(data.finalClicks || [])
  next.mysteryUsed = new Set(data.mysteryUsed || [])
  next.adminSessions = new Set(data.adminSessions || [])
}

function activeGroupGame(): GroupGame | null {
  const event = store().event
  if (!event?.group_game_id) return null
  return store().groupGames.get(event.group_game_id) || null
}

export const gameStore = {
  bootstrap() {
    if (store().event) return
    const adminPin = process.env.ADMIN_PIN || '2468'
    const { hash, salt } = hashPin(adminPin)
    const now = nowIso()
    const event: Event = {
      id: uid(),
      name: '今晚烤肉派對',
      status: 'setup',
      admin_pin_hash: hash,
      admin_pin_salt: salt,
      active_group_game: 'none',
      group_game_id: null,
      score_locked: false,
      settlement_started_at: null,
      donation_ends_at: null,
      created_at: now,
      updated_at: now,
      last_group_game_at: null,
    }
    store().event = event
    const names = [
      '阿樂', '小傑', 'Kevin', 'Mia', '婷婷',
      '阿明', '小雨', 'Jamie', '阿豪', 'Yuki',
      '小安', 'Chris', '阿珍', 'Ben', '小魚',
    ]
    names.forEach((name) => {
      const p: Player = {
        id: uid(),
        event_id: event.id,
        name,
        pin_hash: null,
        pin_salt: null,
        pin_set: false,
        created_at: nowIso(),
        last_seen_at: null,
      }
      store().players.set(p.id, p)
    })
  },

  getPublicState() {
    this.bootstrap()
    const event = requireEvent()
    return {
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        active_group_game: event.active_group_game,
        score_locked: event.score_locked,
        donation_ends_at: event.donation_ends_at,
        settlement_started_at: event.settlement_started_at,
        last_group_game_at: event.last_group_game_at,
      },
      players: publicPlayers(),
      groupGame: activeGroupGame(),
      settlement: store().settlement,
    }
  },

  async load() {
    const data = await persistGetState<SerializedStore>()
    if (!data?.event) return
    hydrateStore(data)
    // Restore bingo photos from separate cache entries (2MB item limit).
    for (const card of store().bingoCards.values()) {
      for (const cell of card.cells) {
        if (cell.photo_data_url) continue
        const photo = await persistGetPhoto(cell.id)
        if (photo) cell.photo_data_url = photo
      }
    }
  },

  async save() {
    const snapshot = serializeStore()
    // Persist photos separately so the main state stays under Runtime Cache limits.
    for (const card of store().bingoCards.values()) {
      for (const cell of card.cells) {
        if (cell.photo_data_url) {
          await persistSetPhoto(cell.id, cell.photo_data_url)
        }
      }
    }
    await persistSetState(snapshot)
  },

  adminLogin(pin: string) {
    this.bootstrap()
    const event = requireEvent()
    const configuredPin = process.env.ADMIN_PIN
    const valid = configuredPin
      ? pin === configuredPin
      : verifyPin(pin, event.admin_pin_hash, event.admin_pin_salt)
    if (!valid) {
      throw new Error('管理員密碼錯誤')
    }
    const token = signAdminToken()
    store().adminSessions.add(token)
    return { token, ...this.getAdminState() }
  },

  getAdminState() {
    const event = requireEvent()
    const { admin_pin_hash: _h, admin_pin_salt: _s, ...safeEvent } = event
    return {
      event: safeEvent,
      players: [...store().players.values()].map((p) => ({
        ...p,
        pin_hash: null,
        pin_salt: null,
      })),
      rankings: rankings(),
      scores: store().scores,
      groupGame: activeGroupGame(),
      settlement: store().settlement,
      prizeDecisions: [...store().prizeDecisions.values()],
      messages: [...store().messages.values()],
    }
  },

  requireAdmin,

  createPlayer(adminToken: string, name: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    const player: Player = {
      id: uid(),
      event_id: event.id,
      name: name.trim().slice(0, 16),
      pin_hash: null,
      pin_salt: null,
      pin_set: false,
      created_at: nowIso(),
      last_seen_at: null,
    }
    store().players.set(player.id, player)
    // reset targets if already assigned so cycle can rebuild next activate
    if (event.status === 'setup') {
      store().targets.clear()
    }
    touch(event)
    return player
  },

  renamePlayer(adminToken: string, playerId: string, name: string) {
    requireAdmin(adminToken)
    const player = store().players.get(playerId)
    if (!player) throw new Error('玩家不存在')
    player.name = name.trim().slice(0, 16)
    return player
  },

  deletePlayer(adminToken: string, playerId: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    if (event.status !== 'setup') throw new Error('活動開始後不可刪除玩家')
    store().players.delete(playerId)
    store().bingoCards.delete(playerId)
    store().targets.delete(playerId)
    for (const [id, t] of store().secretTasks) {
      if (t.player_id === playerId) store().secretTasks.delete(id)
    }
    return true
  },

  adjustScore(adminToken: string, playerId: string, points: number, note: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    addScore(event, playerId, 'admin_adjustment', uid(), points, note || '手動調整')
    return { score: playerScore(playerId) }
  },

  activateEvent(adminToken: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    if ([...store().players.values()].length < 2) throw new Error('至少需要 2 位玩家')
    ensurePlayerAssignments(event)
    event.status = 'active'
    touch(event)
    return this.getAdminState()
  },

  setPlayerPin(playerId: string, pin: string, confirm: string) {
    this.bootstrap()
    if (!/^\d{4}$/.test(pin)) throw new Error('PIN 需為 4 位數字')
    if (pin !== confirm) throw new Error('兩次 PIN 不一致')
    const player = store().players.get(playerId)
    if (!player) throw new Error('玩家不存在')
    if (player.pin_set) throw new Error('此玩家已設定 PIN，請直接登入')
    const { hash, salt } = hashPin(pin)
    player.pin_hash = hash
    player.pin_salt = salt
    player.pin_set = true
    return this.loginPlayer(playerId, pin)
  },

  loginPlayer(playerId: string, pin: string) {
    this.bootstrap()
    const event = requireEvent()
    const player = store().players.get(playerId)
    if (!player || !player.pin_hash || !player.pin_salt) throw new Error('請先設定 PIN')
    if (!verifyPin(pin, player.pin_hash, player.pin_salt)) throw new Error('PIN 錯誤')
    const token = signPlayerToken(player.id)
    const verified = verifyPlayerToken(token)!
    const session: PlayerSession = {
      id: uid(),
      event_id: event.id,
      player_id: player.id,
      token,
      created_at: nowIso(),
      expires_at: new Date(verified.expiresAt).toISOString(),
    }
    store().sessions.set(session.id, session)
    player.last_seen_at = nowIso()
    if (event.status === 'active' || event.status === 'setup') {
      ensurePlayerAssignments(event)
    }
    return { token, player: { id: player.id, name: player.name } }
  },

  getPlayerView(token: string) {
    const { player } = requirePlayerSession(token)
    const event = requireEvent()
    ensurePlayerAssignments(event)
    const card = store().bingoCards.get(player.id) || null
    const secret = [...store().secretTasks.values()].find((t) => t.player_id === player.id) || null
    const target = store().targets.get(player.id) || null
    const myBounties = store().bounties.map((b) => {
      const done = [...store().playerBounties.values()].find(
        (pb) => pb.player_id === player.id && pb.bounty_id === b.id,
      )
      return { ...b, completed: Boolean(done?.completed) }
    })
    const txs = store().scores.filter((s) => s.player_id === player.id)
    const completedBingo = card?.cells.filter((c) => c.completed).length || 0
    const completedBounties = myBounties.filter((b) => b.completed).length
    return {
      event: {
        id: event.id,
        name: event.name,
        status: event.status,
        active_group_game: event.active_group_game,
        score_locked: event.score_locked,
        donation_ends_at: event.donation_ends_at,
        settlement_started_at: event.settlement_started_at,
      },
      player: { id: player.id, name: player.name },
      score: playerScore(player.id),
      txs,
      bingo: card
        ? {
            ...card,
            cells: card.cells.map((c) => ({
              ...c,
              text: c.mystery && !c.revealed ? '神秘任務' : c.text,
            })),
          }
        : null,
      secret,
      target,
      bounties: myBounties,
      bountyRemaining: myBounties.filter((b) => !b.completed).length,
      completedBingo,
      completedBounties,
      groupGame: activeGroupGame(),
      messageSubmitted: [...store().messages.values()].some((m) => m.player_id === player.id),
      prizeDecision: store().prizeDecisions.get(player.id) || null,
      settlement: store().settlement,
      myRank:
        store().settlement?.rankings.find((r) => r.player_id === player.id) || null,
      donationTotal: [...store().prizeDecisions.values()].filter((d) => d.choice === 'donate').length * 10,
      donors: [...store().prizeDecisions.values()].filter((d) => d.choice === 'donate').length,
      // Names only — never include scores here.
      roster: publicPlayers().map((p) => ({ id: p.id, name: p.name })),
      messagesPublic:
        store().messages.size >= store().players.size && store().players.size > 0
          ? [...store().messages.values()].map((m) => ({ id: m.id, text: m.text }))
          : [],
      messagesReady: store().messages.size >= store().players.size && store().players.size > 0,
    }
  },

  revealMystery(token: string, cellId: string) {
    const { player } = requirePlayerSession(token)
    const card = store().bingoCards.get(player.id)
    if (!card) throw new Error('尚未取得九宮格')
    const cell = card.cells.find((c) => c.id === cellId)
    if (!cell) throw new Error('格子不存在')
    if (!cell.mystery) throw new Error('不是神秘題')
    if (cell.revealed) return cell
    cell.revealed = true
    return cell
  },

  completeBingoCell(token: string, cellId: string, photoDataUrl: string) {
    const { player } = requirePlayerSession(token)
    const event = requireEvent()
    assertNotLocked(event)
    const card = store().bingoCards.get(player.id)
    if (!card) throw new Error('尚未取得九宮格')
    const cell = card.cells.find((c) => c.id === cellId)
    if (!cell) throw new Error('格子不存在')
    if (cell.mystery && !cell.revealed) throw new Error('請先揭曉神秘任務')
    if (cell.completed) throw new Error('此格已完成')
    if (!photoDataUrl?.startsWith('data:image/')) throw new Error('請上傳照片')
    if (photoDataUrl.length > 1_800_000) throw new Error('照片太大，請壓縮後再傳')
    // one photo per cell uniqueness soft-check
    if (card.cells.some((c) => c.photo_data_url === photoDataUrl)) {
      throw new Error('這張照片已使用過')
    }
    cell.photo_data_url = photoDataUrl
    cell.completed = true
    cell.completed_at = nowIso()
    addScore(event, player.id, 'bingo', `cell_${cell.id}`, 1, cell.text)

    const { newLines, fullBonus } = computeBingoBonuses(card)
    for (const line of newLines) {
      card.line_bonuses.push(line)
      addScore(event, player.id, 'bingo', `line_${card.id}_${line}`, 1, `連線 ${line}`)
    }
    if (fullBonus) {
      card.full_bonus = true
      addScore(event, player.id, 'bingo', `full_${card.id}`, 2, '九格全滿')
    }
    return this.getPlayerView(token)
  },

  completeSecret(token: string) {
    const { player } = requirePlayerSession(token)
    const event = requireEvent()
    const task = [...store().secretTasks.values()].find((t) => t.player_id === player.id)
    if (!task) throw new Error('沒有秘密任務')
    if (task.completed) throw new Error('已完成')
    task.completed = true
    task.completed_at = nowIso()
    addScore(event, player.id, 'secret_task', task.id, task.points, task.text)
    return this.getPlayerView(token)
  },

  completeTarget(token: string) {
    const { player } = requirePlayerSession(token)
    const event = requireEvent()
    const target = store().targets.get(player.id)
    if (!target) throw new Error('沒有懸賞目標')
    if (target.completed) throw new Error('已完成')
    target.completed = true
    target.completed_at = nowIso()
    addScore(event, player.id, 'target', target.id, target.points, target.text)
    return this.getPlayerView(token)
  },

  completeBounty(token: string, bountyId: string) {
    const { player } = requirePlayerSession(token)
    const event = requireEvent()
    const bounty = store().bounties.find((b) => b.id === bountyId)
    if (!bounty) throw new Error('懸賞不存在')
    const key = `${player.id}_${bountyId}`
    if ([...store().playerBounties.values()].some((pb) => pb.player_id === player.id && pb.bounty_id === bountyId && pb.completed)) {
      throw new Error('已完成此懸賞')
    }
    const row: PlayerBounty = {
      id: uid(),
      event_id: event.id,
      player_id: player.id,
      bounty_id: bountyId,
      completed: true,
      completed_at: nowIso(),
    }
    store().playerBounties.set(key, row)
    addScore(event, player.id, 'bounty', `${player.id}_${bountyId}`, bounty.points, bounty.text)
    return this.getPlayerView(token)
  },

  startDontCopyMe(adminToken: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    if (event.status !== 'active') throw new Error('活動尚未開始')
    const game: GroupGame = {
      id: uid(),
      event_id: event.id,
      kind: 'dont_copy_me',
      status: 'playing',
      round: 1,
      payload: {
        prompts: shuffle(DONT_COPY_PROMPTS).slice(0, 8),
        currentPromptIndex: 0,
        answers: {},
        scoredRounds: [],
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    store().groupGames.set(game.id, game)
    event.active_group_game = 'dont_copy_me'
    event.group_game_id = game.id
    event.last_group_game_at = nowIso()
    touch(event)
    return game
  },

  submitDontCopyAnswer(token: string, text: string) {
    const { player } = requirePlayerSession(token)
    const game = activeGroupGame()
    if (!game || game.kind !== 'dont_copy_me' || game.status !== 'playing') {
      throw new Error('目前沒有此遊戲')
    }
    const answers = (game.payload.answers as Record<string, Record<string, string>>) || {}
    const roundKey = String(game.round)
    answers[roundKey] = answers[roundKey] || {}
    answers[roundKey][player.id] = text.trim().slice(0, 40)
    game.payload.answers = answers
    game.updated_at = nowIso()
    return true
  },

  scoreDontCopyRound(adminToken: string, uniquePlayerIds: string[]) {
    requireAdmin(adminToken)
    const event = requireEvent()
    const game = activeGroupGame()
    if (!game || game.kind !== 'dont_copy_me') throw new Error('遊戲不存在')
    const scored = (game.payload.scoredRounds as number[]) || []
    if (scored.includes(game.round)) throw new Error('本輪已計分')
    for (const pid of uniquePlayerIds) {
      addScore(event, pid, 'group_game', `${game.id}_r${game.round}_${pid}`, 1, `不要跟我一樣 R${game.round}`)
    }
    scored.push(game.round)
    game.payload.scoredRounds = scored
    game.status = 'round_result'
    game.updated_at = nowIso()
    return game
  },

  nextDontCopyRound(adminToken: string) {
    requireAdmin(adminToken)
    const game = activeGroupGame()
    if (!game || game.kind !== 'dont_copy_me') throw new Error('遊戲不存在')
    const prompts = game.payload.prompts as string[]
    if (game.round >= prompts.length) {
      return this.endGroupGame(adminToken)
    }
    game.round += 1
    game.status = 'playing'
    game.payload.currentPromptIndex = game.round - 1
    game.updated_at = nowIso()
    return game
  },

  startWhoWroteIt(adminToken: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    if (event.status !== 'active') throw new Error('活動尚未開始')
    const game: GroupGame = {
      id: uid(),
      event_id: event.id,
      kind: 'who_wrote_it',
      status: 'playing',
      round: 1,
      payload: {
        prompt: pick(WHO_WROTE_PROMPTS),
        answers: [] as Array<{ id: string; player_id: string; text: string; revealed: boolean }>,
        currentAnswerId: null,
        votes: {} as Record<string, string>,
        revealedPlayerIds: [] as string[],
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    store().groupGames.set(game.id, game)
    event.active_group_game = 'who_wrote_it'
    event.group_game_id = game.id
    event.last_group_game_at = nowIso()
    touch(event)
    return game
  },

  submitWhoWroteAnswer(token: string, text: string) {
    const { player } = requirePlayerSession(token)
    const game = activeGroupGame()
    if (!game || game.kind !== 'who_wrote_it' || game.status !== 'playing') {
      throw new Error('目前無法作答')
    }
    const answers = game.payload.answers as Array<{
      id: string
      player_id: string
      text: string
      revealed: boolean
    }>
    if (answers.some((a) => a.player_id === player.id)) throw new Error('已提交')
    answers.push({
      id: uid(),
      player_id: player.id,
      text: text.trim().slice(0, 200),
      revealed: false,
    })
    game.payload.answers = answers
    game.updated_at = nowIso()
    return true
  },

  drawWhoWroteAnswer(adminToken?: string) {
    if (adminToken) requireAdmin(adminToken)
    const game = activeGroupGame()
    if (!game || game.kind !== 'who_wrote_it') throw new Error('遊戲不存在')
    const answers = game.payload.answers as Array<{
      id: string
      player_id: string
      text: string
      revealed: boolean
    }>
    const pool = answers.filter((a) => !a.revealed)
    if (!pool.length) {
      game.status = 'finished'
      return game
    }
    const drawn = pick(pool)
    game.payload.currentAnswerId = drawn.id
    game.payload.currentAuthorId = drawn.player_id
    game.payload.votes = {}
    game.status = 'voting'
    game.updated_at = nowIso()
    return game
  },

  voteWhoWrote(token: string, guessedPlayerId: string) {
    const { player } = requirePlayerSession(token)
    const event = requireEvent()
    const game = activeGroupGame()
    if (!game || game.kind !== 'who_wrote_it' || game.status !== 'voting') {
      throw new Error('目前無法投票')
    }
    const revealed = (game.payload.revealedPlayerIds as string[]) || []
    if (revealed.includes(guessedPlayerId)) throw new Error('此玩家已揭曉')
    const votes = (game.payload.votes as Record<string, string>) || {}
    if (votes[player.id]) throw new Error('已投票')
    votes[player.id] = guessedPlayerId
    game.payload.votes = votes
    game.updated_at = nowIso()

    const eligibleVoterIds = [...store().players.keys()].filter((id) => id !== (game.payload.currentAuthorId as string | undefined))
    if (Object.keys(votes).length >= eligibleVoterIds.length) {
      const answers = game.payload.answers as Array<{
        id: string
        player_id: string
        text: string
        revealed: boolean
      }>
      const currentId = game.payload.currentAnswerId as string
      const answer = answers.find((a) => a.id === currentId)
      if (answer) {
        for (const [voterId, guess] of Object.entries(votes)) {
          if (guess === answer.player_id) {
            addScore(
              event,
              voterId,
              'who_wrote_it',
              `${game.id}_${currentId}_${voterId}`,
              1,
              '猜對作者',
            )
          }
        }
        answer.revealed = true
        revealed.push(answer.player_id)
        game.payload.revealedPlayerIds = revealed
        game.payload.reveal = {
          player_id: answer.player_id,
          text: answer.text,
        }
        game.status = 'round_result'
      }
    }
    return true
  },

  endGroupGame(adminToken: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    event.active_group_game = 'none'
    event.group_game_id = null
    event.last_group_game_at = nowIso()
    touch(event)
    return true
  },

  startFinalButton(adminToken: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    if (event.score_locked) throw new Error('已鎖分')
    const start = Date.now() + 3000
    const end = start + 10_000
    const game: GroupGame = {
      id: uid(),
      event_id: event.id,
      kind: 'final_button',
      status: 'playing',
      round: 1,
      payload: {
        countdownEndsAt: start,
        endsAt: end,
        startedAt: start,
        finished: false,
      },
      created_at: nowIso(),
      updated_at: nowIso(),
    }
    store().groupGames.set(game.id, game)
    store().finalClicks.clear()
    event.status = 'final_game'
    event.active_group_game = 'final_button'
    event.group_game_id = game.id
    touch(event)
    return game
  },

  clickFinalButton(token: string, clientTs: number, clickCount = 1) {
    const { player } = requirePlayerSession(token)
    const event = requireEvent()
    const game = activeGroupGame()
    if (!game || game.kind !== 'final_button') throw new Error('遊戲未開始')
    const now = Date.now()
    const start = Number(game.payload.startedAt)
    const end = Number(game.payload.endsAt)
    if (now < start) throw new Error('尚未開始')
    if (now > end || game.payload.finished) {
      this.finishFinalButton()
      throw new Error('時間到')
    }
    // reject wildly skewed client timestamps
    if (Math.abs(clientTs - now) > 5000) throw new Error('時間異常')
    const row = store().finalClicks.get(player.id) || { count: 0, lastAt: 0, events: [] as number[] }
    if (now - row.lastAt < 40) {
      // ignore superhuman spam; do not error to keep UX smooth
      return { count: row.count }
    }
    const accepted = Math.max(1, Math.min(12, Math.floor(clickCount || 1)))
    const elapsed = row.lastAt ? Math.max(1, now - row.lastAt) : 500
    const maxForWindow = Math.max(1, Math.ceil(elapsed / 40))
    const increment = Math.min(accepted, maxForWindow)
    row.count += increment
    row.lastAt = now
    row.events.push(now)
    if (row.events.length > 400) row.events = row.events.slice(-400)
    store().finalClicks.set(player.id, row)
    return { count: row.count }
  },

  finishFinalButton(adminToken?: string) {
    if (adminToken) requireAdmin(adminToken)
    const event = requireEvent()
    const game = activeGroupGame()
    if (!game || game.kind !== 'final_button') return null
    if (game.payload.finished) return game
    game.payload.finished = true
    game.status = 'finished'
    const ranked = [...store().finalClicks.entries()]
      .map(([playerId, data]) => ({ playerId, count: data.count }))
      .sort((a, b) => b.count - a.count)
    const points = [3, 2, 1]
    ranked.slice(0, 3).forEach((row, idx) => {
      try {
        addScore(
          event,
          row.playerId,
          'final_button',
          `${game.id}_${row.playerId}`,
          points[idx],
          `按鈕大戰第 ${idx + 1} 名 (${row.count} 次)`,
        )
      } catch {
        // already scored
      }
    })
    game.payload.results = ranked
    event.active_group_game = 'none'
    event.status = 'message'
    touch(event)
    return game
  },

  submitMessage(token: string, text: string) {
    const { player } = requirePlayerSession(token)
    const event = requireEvent()
    if (event.status !== 'message' && event.status !== 'active' && event.status !== 'final_game') {
      // allow during message phase primarily
    }
    if ([...store().messages.values()].some((m) => m.player_id === player.id)) {
      throw new Error('已送出')
    }
    const cleaned = text.trim().slice(0, 280)
    if (!cleaned) throw new Error('請輸入內容')
    store().messages.set(player.id, {
      id: uid(),
      event_id: event.id,
      player_id: player.id,
      text: cleaned,
      created_at: nowIso(),
    })
    return true
  },

  openMessages(adminToken: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    event.status = 'message'
    touch(event)
    return [...store().messages.values()]
  },

  lockScores(adminToken: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    // finish final button if still running
    if (event.active_group_game === 'final_button') this.finishFinalButton(adminToken)
    event.score_locked = true
    event.status = 'score_locked'
    event.active_group_game = 'none'
    touch(event)
    return this.getAdminState()
  },

  startSettlement(adminToken: string, tieBreakOrder?: string[]) {
    requireAdmin(adminToken)
    const event = requireEvent()
    if (!event.score_locked) throw new Error('請先鎖定積分')
    let ranked = rankings()

    // apply optional tie-break for top3 conflicts
    if (tieBreakOrder?.length) {
      const order = new Map(tieBreakOrder.map((id, i) => [id, i]))
      ranked = [...ranked].sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score
        const ao = order.has(a.player_id) ? order.get(a.player_id)! : 999
        const bo = order.has(b.player_id) ? order.get(b.player_id)! : 999
        return ao - bo
      }).map((row, i) => ({ ...row, rank: i + 1 }))
    }

    const settlement: Settlement = {
      id: uid(),
      event_id: event.id,
      rankings: ranked.map((r) => ({
        player_id: r.player_id,
        rank: r.rank,
        score: r.score,
        prize: r.rank === 1 ? 1069 : r.rank === 2 ? 0 : r.rank === 3 ? 69 : 10,
      })),
      tie_breaks: tieBreakOrder?.length
        ? [{ player_ids: tieBreakOrder, decided_order: tieBreakOrder }]
        : [],
      created_at: nowIso(),
    }
    store().settlement = settlement
    store().prizeDecisions.clear()
    for (const row of settlement.rankings) {
      if (row.rank >= 4) {
        store().prizeDecisions.set(row.player_id, {
          id: uid(),
          event_id: event.id,
          player_id: row.player_id,
          rank: row.rank,
          choice: null,
          amount: 10,
          decided_at: null,
          auto: false,
        })
      }
    }
    event.status = 'settlement'
    event.settlement_started_at = nowIso()
    event.donation_ends_at = new Date(Date.now() + 60_000).toISOString()
    touch(event)
    return settlement
  },

  decidePrize(token: string, choice: 'keep' | 'donate') {
    const { player } = requirePlayerSession(token)
    const event = requireEvent()
    if (event.status !== 'settlement') throw new Error('尚未開始結算')
    const decision = store().prizeDecisions.get(player.id)
    if (!decision) throw new Error('你沒有贈與選項')
    if (decision.choice) throw new Error('已決定，不能修改')
    const ends = event.donation_ends_at ? new Date(event.donation_ends_at).getTime() : 0
    if (Date.now() > ends) {
      decision.choice = 'keep'
      decision.auto = true
      decision.decided_at = nowIso()
      throw new Error('時間到，已自動領取')
    }
    decision.choice = choice
    decision.decided_at = nowIso()
    decision.auto = false
    return this.getPlayerView(token)
  },

  finalizeDonationDefaults() {
    const event = requireEvent()
    if (!event.donation_ends_at) return
    if (Date.now() < new Date(event.donation_ends_at).getTime()) return
    for (const d of store().prizeDecisions.values()) {
      if (!d.choice) {
        d.choice = 'keep'
        d.auto = true
        d.decided_at = nowIso()
      }
    }
  },

  finishEvent(adminToken: string) {
    requireAdmin(adminToken)
    const event = requireEvent()
    this.finalizeDonationDefaults()
    event.status = 'finished'
    touch(event)
    return this.getAdminState()
  },

  topTies() {
    const ranked = rankings()
    const ties: Array<{ score: number; players: typeof ranked }> = []
    for (const score of new Set(ranked.map((r) => r.score))) {
      const group = ranked.filter((r) => r.score === score)
      if (group.length > 1 && group.some((g) => g.rank <= 3)) {
        ties.push({ score, players: group })
      }
    }
    return ties
  },

  setStatus(adminToken: string, status: EventStatus) {
    requireAdmin(adminToken)
    const event = requireEvent()
    event.status = status
    touch(event)
    return event
  },
}
