/** MediaPipe hand landmark indices */
export const HAND = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const

export type Landmark = { x: number; y: number; z: number }

export type GestureId = 'none' | 'thumbs_up' | 'ok' | 'open_palm' | 'peace' | 'fist' | 'point'

export type GestureInfo = {
  id: GestureId
  label: string
  effect: string
}

export const GESTURE_META: Record<GestureId, Omit<GestureInfo, 'id'>> = {
  none: { label: '未偵測', effect: '—' },
  thumbs_up: { label: '比讚', effect: '煙火' },
  ok: { label: 'OK', effect: '閃爍' },
  open_palm: { label: '張開手掌', effect: '柔光脈衝' },
  peace: { label: '耶 / Peace', effect: '星光灑落' },
  fist: { label: '拳頭', effect: '震動波紋' },
  point: { label: '指向', effect: '雷射點' },
}

function dist(a: Landmark, b: Landmark) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function fingerExtended(landmarks: Landmark[], tip: number, pip: number, mcp: number) {
  const wrist = landmarks[HAND.WRIST]
  const tipDist = dist(landmarks[tip], wrist)
  const pipDist = dist(landmarks[pip], wrist)
  const mcpDist = dist(landmarks[mcp], wrist)
  return tipDist > pipDist * 1.08 && tipDist > mcpDist * 1.02
}

function thumbUp(landmarks: Landmark[]) {
  const tip = landmarks[HAND.THUMB_TIP]
  const mcp = landmarks[HAND.THUMB_MCP]
  const indexMcp = landmarks[HAND.INDEX_MCP]
  const extended = dist(tip, indexMcp) > dist(mcp, indexMcp) * 1.15
  // Camera coords: y grows downward — "up" means tip.y < mcp.y
  const pointingUp = tip.y < mcp.y - 0.04
  return extended && pointingUp
}

function isOk(landmarks: Landmark[]) {
  const pinch = dist(landmarks[HAND.THUMB_TIP], landmarks[HAND.INDEX_TIP]) < 0.07
  const middle = fingerExtended(landmarks, HAND.MIDDLE_TIP, HAND.MIDDLE_PIP, HAND.MIDDLE_MCP)
  const ring = fingerExtended(landmarks, HAND.RING_TIP, HAND.RING_PIP, HAND.RING_MCP)
  return pinch && (middle || ring)
}

export function classifyGesture(landmarks: Landmark[]): GestureId {
  if (!landmarks || landmarks.length < 21) return 'none'

  const index = fingerExtended(landmarks, HAND.INDEX_TIP, HAND.INDEX_PIP, HAND.INDEX_MCP)
  const middle = fingerExtended(landmarks, HAND.MIDDLE_TIP, HAND.MIDDLE_PIP, HAND.MIDDLE_MCP)
  const ring = fingerExtended(landmarks, HAND.RING_TIP, HAND.RING_PIP, HAND.RING_MCP)
  const pinky = fingerExtended(landmarks, HAND.PINKY_TIP, HAND.PINKY_PIP, HAND.PINKY_MCP)
  const thumb = thumbUp(landmarks)
  const extendedCount = [index, middle, ring, pinky].filter(Boolean).length

  if (isOk(landmarks)) return 'ok'
  if (thumb && extendedCount <= 1) return 'thumbs_up'
  if (index && middle && !ring && !pinky) return 'peace'
  if (index && !middle && !ring && !pinky) return 'point'
  if (extendedCount >= 3) return 'open_palm'
  if (extendedCount === 0 && !thumb) return 'fist'
  return 'none'
}

/** Connections for drawing a simple hand skeleton */
export const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [5, 9],
  [9, 13],
  [13, 17],
]
