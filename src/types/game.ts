import type { Room } from './room'
import type { Player } from './player'

export type GameId = 'perfect_man'

export type PerfectManMode = 'classic' | 'reverse' | 'theme' | 'speed'

export type QuestionCategory =
  | 'relationship'
  | 'lifestyle'
  | 'money'
  | 'social'
  | 'family'
  | 'weird'
  | 'redflag'
  | 'spicy'

export type GameSessionStatus =
  | 'lobby'
  | 'mode_select'
  | 'question'
  | 'answering'
  | 'result'
  | 'discussion'
  | 'finished'

export interface GameMeta {
  id: GameId
  name: string
  description: string
  icon: string
  min_players: number
  enabled: boolean
}

export interface Question {
  id: string
  game_id: GameId
  mode: 'classic' | 'reverse'
  category: QuestionCategory
  base_score: number
  text: string
  enabled: boolean
}

export interface GameSession {
  id: string
  room_id: string
  game_id: GameId
  mode: PerfectManMode
  status: GameSessionStatus
  round: number
  current_question_id: string | null
  categories: QuestionCategory[]
  used_question_ids: string[]
  answering_deadline: string | null
  created_at: string
  updated_at: string
}

export interface Answer {
  id: string
  session_id: string
  question_id: string
  player_id: string
  score: number
  submitted_at: string
  missed?: boolean
}

export interface RoomSnapshot {
  room: Room
  players: Player[]
  session: GameSession | null
  answers: Answer[]
  currentQuestion: Question | null
}
