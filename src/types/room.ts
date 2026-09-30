export type RoomStatus = 'lobby' | 'selecting_game' | 'playing' | 'closed'

export interface Room {
  id: string
  code: string
  host_id: string | null
  status: RoomStatus
  selected_game_id: string | null
  created_at: string
  updated_at: string
  last_activity_at: string
}
