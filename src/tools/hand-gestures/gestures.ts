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

export type Point2 = { x: number; y: number }

export type GestureId =
  | 'none'
  | 'thumbs_up'
  | 'ok'
  | 'open_palm'
  | 'peace'
  | 'fist'
  | 'point'
  | 'l_shape'

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
  l_shape: { label: 'L 手勢', effect: '角點（雙手可成四邊形）' },
}

function dist(a: Landmark | Point2, b: Landmark | Point2) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function fingerExtended(landmarks: Landmark[], tip: number, pip: number, mcp: number) {
  const wrist = landmarks[HAND.WRIST]
  const tipDist = dist(landmarks[tip], wrist)
  const pipDist = dist(landmarks[pip], wrist)
  const mcpDist = dist(landmarks[mcp], wrist)
  return tipDist > pipDist * 1.08 && tipDist > mcpDist * 1.02
}

function thumbExtended(landmarks: Landmark[]) {
  const tip = landmarks[HAND.THUMB_TIP]
  const mcp = landmarks[HAND.THUMB_MCP]
  const indexMcp = landmarks[HAND.INDEX_MCP]
  return dist(tip, indexMcp) > dist(mcp, indexMcp) * 1.12
}

function thumbUp(landmarks: Landmark[]) {
  const tip = landmarks[HAND.THUMB_TIP]
  const mcp = landmarks[HAND.THUMB_MCP]
  const extended = thumbExtended(landmarks)
  const pointingUp = tip.y < mcp.y - 0.04
  return extended && pointingUp
}

function isOk(landmarks: Landmark[]) {
  const pinch = dist(landmarks[HAND.THUMB_TIP], landmarks[HAND.INDEX_TIP]) < 0.07
  const middle = fingerExtended(landmarks, HAND.MIDDLE_TIP, HAND.MIDDLE_PIP, HAND.MIDDLE_MCP)
  const ring = fingerExtended(landmarks, HAND.RING_TIP, HAND.RING_PIP, HAND.RING_MCP)
  return pinch && (middle || ring)
}

/** L: index + thumb out, other fingers curled (not OK pinch, not thumbs-up). */
export function isLShape(landmarks: Landmark[]) {
  if (!landmarks || landmarks.length < 21) return false
  const index = fingerExtended(landmarks, HAND.INDEX_TIP, HAND.INDEX_PIP, HAND.INDEX_MCP)
  const middle = fingerExtended(landmarks, HAND.MIDDLE_TIP, HAND.MIDDLE_PIP, HAND.MIDDLE_MCP)
  const ring = fingerExtended(landmarks, HAND.RING_TIP, HAND.RING_PIP, HAND.RING_MCP)
  const pinky = fingerExtended(landmarks, HAND.PINKY_TIP, HAND.PINKY_PIP, HAND.PINKY_MCP)
  if (!index || !thumbExtended(landmarks)) return false
  if (middle || ring || pinky) return false
  if (dist(landmarks[HAND.THUMB_TIP], landmarks[HAND.INDEX_TIP]) < 0.085) return false
  if (thumbUp(landmarks)) return false

  // Prefer a roughly open angle between thumb and index.
  const origin = landmarks[HAND.INDEX_MCP]
  const vx = landmarks[HAND.INDEX_TIP].x - origin.x
  const vy = landmarks[HAND.INDEX_TIP].y - origin.y
  const tx = landmarks[HAND.THUMB_TIP].x - origin.x
  const ty = landmarks[HAND.THUMB_TIP].y - origin.y
  const dot = vx * tx + vy * ty
  const mag = Math.hypot(vx, vy) * Math.hypot(tx, ty)
  if (mag < 1e-6) return false
  const cos = dot / mag
  return cos > -0.35 && cos < 0.72
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
  if (isLShape(landmarks)) return 'l_shape'
  if (thumb && extendedCount <= 1) return 'thumbs_up'
  if (index && middle && !ring && !pinky) return 'peace'
  if (index && !middle && !ring && !pinky) return 'point'
  if (extendedCount >= 3) return 'open_palm'
  if (extendedCount === 0 && !thumbExtended(landmarks)) return 'fist'
  return 'none'
}

/** Thumb tip + index tip corners for an L hand. */
export function getLCorners(landmarks: Landmark[]): [Landmark, Landmark] | null {
  if (!isLShape(landmarks)) return null
  return [landmarks[HAND.THUMB_TIP], landmarks[HAND.INDEX_TIP]]
}

/** Sort points counter-clockwise around centroid so polygon edges don't cross. */
export function orderPolygon(points: Point2[]): Point2[] {
  if (points.length < 3) return points.slice()
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length
  return points
    .slice()
    .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
}

export function toScreenPoint(lm: Landmark, w: number, h: number, mirrored: boolean): Point2 {
  return {
    x: mirrored ? (1 - lm.x) * w : lm.x * w,
    y: lm.y * h,
  }
}

/**
 * If both hands are L shapes, return the irregular quad from the four tip corners.
 * Otherwise when two hands are present, return a softer hull from outer landmarks.
 */
export function shapeBetweenHands(
  hands: Landmark[][],
): { kind: 'l_quad' | 'hull'; points: Landmark[]; label: string } | null {
  if (hands.length < 2) return null
  const a = hands[0]
  const b = hands[1]
  const cornersA = getLCorners(a)
  const cornersB = getLCorners(b)
  if (cornersA && cornersB) {
    return {
      kind: 'l_quad',
      points: [...cornersA, ...cornersB],
      label: '雙手 L → 四邊形',
    }
  }

  // Generic inter-hand shape: wrist + index/pinky tips of both hands.
  const hullSeed = [
    a[HAND.WRIST],
    a[HAND.INDEX_TIP],
    a[HAND.PINKY_TIP],
    b[HAND.WRIST],
    b[HAND.INDEX_TIP],
    b[HAND.PINKY_TIP],
  ]
  return {
    kind: 'hull',
    points: hullSeed,
    label: '雙手空間',
  }
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
