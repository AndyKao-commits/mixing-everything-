export type EventStatus =
  | 'setup'
  | 'active'
  | 'final_game'
  | 'score_locked'
  | 'message'
  | 'settlement'
  | 'finished'

export type ScoreSource =
  | 'bingo'
  | 'secret_task'
  | 'bounty'
  | 'target'
  | 'group_game'
  | 'who_wrote_it'
  | 'final_button'
  | 'admin_adjustment'

export type GroupGameKind = 'dont_copy_me' | 'who_wrote_it' | 'final_button' | 'none'

export type BingoCategory =
  | 'food'
  | 'object'
  | 'people'
  | 'moment'
  | 'creative'
  | 'named'
  | 'mystery'

export interface Event {
  id: string
  name: string
  status: EventStatus
  admin_pin_hash: string
  admin_pin_salt: string
  active_group_game: GroupGameKind
  group_game_id: string | null
  score_locked: boolean
  settlement_started_at: string | null
  donation_ends_at: string | null
  created_at: string
  updated_at: string
  last_group_game_at: string | null
}

export interface Player {
  id: string
  event_id: string
  name: string
  pin_hash: string | null
  pin_salt: string | null
  pin_set: boolean
  created_at: string
  last_seen_at: string | null
}

export interface PlayerSession {
  id: string
  event_id: string
  player_id: string
  token: string
  created_at: string
  expires_at: string
}

export interface ScoreTransaction {
  id: string
  event_id: string
  player_id: string
  source_type: ScoreSource
  source_id: string
  points: number
  note?: string
  created_at: string
}

export interface BingoCell {
  id: string
  index: number
  category: BingoCategory
  text: string
  mystery: boolean
  revealed: boolean
  photo_data_url: string | null
  completed: boolean
  completed_at: string | null
}

export interface BingoCard {
  id: string
  event_id: string
  player_id: string
  cells: BingoCell[]
  line_bonuses: string[]
  full_bonus: boolean
}

export interface SecretTask {
  id: string
  event_id: string
  player_id: string
  text: string
  points: number
  target_player_id: string | null
  completed: boolean
  completed_at: string | null
}

export interface Bounty {
  id: string
  event_id: string
  text: string
  points: number
}

export interface PlayerBounty {
  id: string
  event_id: string
  player_id: string
  bounty_id: string
  completed: boolean
  completed_at: string | null
}

export interface PlayerTarget {
  id: string
  event_id: string
  player_id: string
  target_player_id: string
  text: string
  points: number
  completed: boolean
  completed_at: string | null
}

export interface GroupGame {
  id: string
  event_id: string
  kind: GroupGameKind
  status: 'lobby' | 'playing' | 'round_result' | 'voting' | 'finished'
  round: number
  payload: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface FinalMessage {
  id: string
  event_id: string
  player_id: string
  text: string
  created_at: string
}

export interface PrizeDecision {
  id: string
  event_id: string
  player_id: string
  rank: number
  choice: 'keep' | 'donate' | null
  amount: number
  decided_at: string | null
  auto: boolean
}

export interface Settlement {
  id: string
  event_id: string
  rankings: Array<{ player_id: string; rank: number; score: number; prize: number }>
  tie_breaks: Array<{ player_ids: string[]; decided_order: string[] }>
  created_at: string
}

export interface PublicPlayer {
  id: string
  name: string
  pin_set: boolean
  last_seen_at: string | null
}
