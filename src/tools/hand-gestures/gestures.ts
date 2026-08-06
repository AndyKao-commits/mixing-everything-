/** MediaPipe hand landmark indices — tips are 4 / 8 / 12 / 16 / 20 */
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

export const FINGERTIP_IDS = [
  HAND.THUMB_TIP,
  HAND.INDEX_TIP,
  HAND.MIDDLE_TIP,
  HAND.RING_TIP,
  HAND.PINKY_TIP,
] as const

export type Landmark = { x: number; y: number; z: number }
export type Point2 = { x: number; y: number }

export type ViewMapping = {
  canvasW: number
  canvasH: number
  videoW: number
  videoH: number
  mirrored: boolean
}

export type GestureId =
  | 'none'
  | 'thumbs_up'
  | 'ok'
  | 'open_palm'
  | 'peace'
  | 'fist'
  | 'point'
  | 'l_shape'
  | 'magic'

export type ElementId = 'metal' | 'wood' | 'water' | 'fire' | 'earth'

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
  l_shape: { label: 'L 手勢', effect: '開合後可成四邊形' },
  magic: {
    label: '前刺魔法',
    effect: '拳頭／指劍蓄力，整手前刺發射（冷卻 1.5 秒）',
  },
}

export const ELEMENT_META: Record<
  ElementId,
  { label: string; combo: string; effect: string; color: string }
> = {
  metal: { label: '金', combo: '雙手指向 或 雙手 L', effect: '金屬碎光', color: '#c0c7d1' },
  wood: { label: '木', combo: '雙手耶', effect: '葉脈生長', color: '#4caf50' },
  water: { label: '水', combo: '雙手張開', effect: '水流波紋', color: '#4fc3f7' },
  fire: { label: '火', combo: '雙手比讚 或 雙手指劍', effect: '火焰爆發', color: '#ff5722' },
  earth: { label: '土', combo: '雙手拳頭', effect: '地裂塵土', color: '#8d6e63' },
}

export const FINGER_CHAINS: number[][] = [
  [HAND.WRIST, HAND.THUMB_CMC, HAND.THUMB_MCP, HAND.THUMB_IP, HAND.THUMB_TIP],
  [HAND.WRIST, HAND.INDEX_MCP, HAND.INDEX_PIP, HAND.INDEX_DIP, HAND.INDEX_TIP],
  [HAND.WRIST, HAND.MIDDLE_MCP, HAND.MIDDLE_PIP, HAND.MIDDLE_DIP, HAND.MIDDLE_TIP],
  [HAND.WRIST, HAND.RING_MCP, HAND.RING_PIP, HAND.RING_DIP, HAND.RING_TIP],
  [HAND.WRIST, HAND.PINKY_MCP, HAND.PINKY_PIP, HAND.PINKY_DIP, HAND.PINKY_TIP],
]

export const PALM_OUTLINE = [
  HAND.WRIST,
  HAND.THUMB_CMC,
  HAND.INDEX_MCP,
  HAND.MIDDLE_MCP,
  HAND.RING_MCP,
  HAND.PINKY_MCP,
] as const

export function dist(a: Landmark | Point2, b: Landmark | Point2) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function cloneLandmark(lm: Landmark): Landmark {
  return { x: lm.x, y: lm.y, z: lm.z }
}

export function cloneHand(landmarks: Landmark[]): Landmark[] {
  return landmarks.map(cloneLandmark)
}

export function palmCenter(landmarks: Landmark[]): Landmark {
  const ids: number[] = [HAND.WRIST, HAND.INDEX_MCP, HAND.MIDDLE_MCP, HAND.RING_MCP, HAND.PINKY_MCP]
  const x = ids.reduce((s, i) => s + landmarks[i].x, 0) / ids.length
  const y = ids.reduce((s, i) => s + landmarks[i].y, 0) / ids.length
  const z = ids.reduce((s, i) => s + landmarks[i].z, 0) / ids.length
  return { x, y, z }
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
  return thumbExtended(landmarks) && tip.y < mcp.y - 0.04
}

function isOk(landmarks: Landmark[]) {
  const pinch = dist(landmarks[HAND.THUMB_TIP], landmarks[HAND.INDEX_TIP]) < 0.07
  const middle = fingerExtended(landmarks, HAND.MIDDLE_TIP, HAND.MIDDLE_PIP, HAND.MIDDLE_MCP)
  const ring = fingerExtended(landmarks, HAND.RING_TIP, HAND.RING_PIP, HAND.RING_MCP)
  return pinch && (middle || ring)
}

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

  const origin = landmarks[HAND.INDEX_MCP]
  const vx = landmarks[HAND.INDEX_TIP].x - origin.x
  const vy = landmarks[HAND.INDEX_TIP].y - origin.y
  const tx = landmarks[HAND.THUMB_TIP].x - origin.x
  const ty = landmarks[HAND.THUMB_TIP].y - origin.y
  const mag = Math.hypot(vx, vy) * Math.hypot(tx, ty)
  if (mag < 1e-6) return false
  const cos = (vx * tx + vy * ty) / mag
  return cos > -0.35 && cos < 0.72
}

/**
 * 指劍：食指＋中指併攏伸出，其餘手指收起（與「耶」分開看指尖距離）。
 * 第一視角時常失敗，僅作加分；蓄力另看 canChargeMagic。
 */
export function isFingerSword(landmarks: Landmark[]) {
  if (!landmarks || landmarks.length < 21) return false
  const index = fingerExtended(landmarks, HAND.INDEX_TIP, HAND.INDEX_PIP, HAND.INDEX_MCP)
  const middle = fingerExtended(landmarks, HAND.MIDDLE_TIP, HAND.MIDDLE_PIP, HAND.MIDDLE_MCP)
  const ring = fingerExtended(landmarks, HAND.RING_TIP, HAND.RING_PIP, HAND.RING_MCP)
  const pinky = fingerExtended(landmarks, HAND.PINKY_TIP, HAND.PINKY_PIP, HAND.PINKY_MCP)
  if (!index || !middle) return false
  if (ring || pinky) return false
  if (dist(landmarks[HAND.INDEX_TIP], landmarks[HAND.MIDDLE_TIP]) > 0.078) return false
  if (thumbUp(landmarks)) return false
  return true
}

/** @deprecated use isFingerSword — kept as alias for magic gesture id path */
export function isMagic(landmarks: Landmark[]) {
  return isFingerSword(landmarks)
}

/** Apparent hand size — shrinks when thrusting away from camera (FP rear). */
export function handSpan(landmarks: Landmark[]) {
  return (
    dist(landmarks[HAND.INDEX_MCP], landmarks[HAND.PINKY_MCP]) * 0.55 +
    dist(landmarks[HAND.WRIST], landmarks[HAND.MIDDLE_TIP]) * 0.45
  )
}

/**
 * Easy charge poses for first-person: fist, finger-sword, or mostly closed hand.
 * Avoids relying on fine fingertip shapes under foreshortening.
 */
export function canChargeMagic(landmarks: Landmark[]) {
  if (!landmarks || landmarks.length < 21) return false
  if (isFingerSword(landmarks)) return true
  const g = classifyGesture(landmarks)
  if (g === 'fist' || g === 'magic') return true
  // Soft closed: average finger openness low (fist misread as none / point stubs).
  const opens = [
    fingerOpenness(landmarks, HAND.INDEX_TIP, HAND.INDEX_PIP, HAND.INDEX_MCP),
    fingerOpenness(landmarks, HAND.MIDDLE_TIP, HAND.MIDDLE_PIP, HAND.MIDDLE_MCP),
    fingerOpenness(landmarks, HAND.RING_TIP, HAND.RING_PIP, HAND.RING_MCP),
    fingerOpenness(landmarks, HAND.PINKY_TIP, HAND.PINKY_PIP, HAND.PINKY_MCP),
  ]
  const avg = opens.reduce((s, v) => s + v, 0) / opens.length
  if (avg < 0.38 && !thumbUp(landmarks)) return true
  return false
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
  if (isFingerSword(landmarks)) return 'magic'
  if (isLShape(landmarks)) return 'l_shape'
  if (thumb && extendedCount <= 1) return 'thumbs_up'
  if (index && middle && !ring && !pinky) return 'peace'
  if (index && !middle && !ring && !pinky) return 'point'
  if (extendedCount >= 3) return 'open_palm'
  if (extendedCount === 0 && !thumbExtended(landmarks)) return 'fist'
  return 'none'
}

/** Dual-hand elemental combo. */
export function classifyElement(hands: Landmark[][]): ElementId | null {
  if (hands.length < 2) return null
  const a = classifyGesture(hands[0])
  const b = classifyGesture(hands[1])
  const pair = new Set([a, b])

  if (a === 'point' && b === 'point') return 'metal'
  if (a === 'l_shape' && b === 'l_shape') return 'metal'
  if (a === 'peace' && b === 'peace') return 'wood'
  if (a === 'open_palm' && b === 'open_palm') return 'water'
  if (a === 'thumbs_up' && b === 'thumbs_up') return 'fire'
  if (a === 'magic' && b === 'magic') return 'fire'
  if (a === 'fist' && b === 'fist') return 'earth'
  if (pair.has('fist') && pair.has('open_palm')) return 'earth'
  if (pair.has('magic') && pair.has('thumbs_up')) return 'fire'
  return null
}

export function getLCorners(landmarks: Landmark[]): [Landmark, Landmark] | null {
  if (!isLShape(landmarks)) return null
  return [landmarks[HAND.THUMB_TIP], landmarks[HAND.INDEX_TIP]]
}

/** 瞄準：有指劍用劍尖；否則用拳峰／前臂方向；過扁時改朝畫面正前方。 */
export function magicAim(landmarks: Landmark[]): {
  origin: Landmark
  base: Landmark
  dir: Point2
} {
  const wrist = landmarks[HAND.WRIST]
  const knuckles: Landmark = {
    x: (landmarks[HAND.INDEX_MCP].x + landmarks[HAND.MIDDLE_MCP].x + landmarks[HAND.RING_MCP].x) / 3,
    y: (landmarks[HAND.INDEX_MCP].y + landmarks[HAND.MIDDLE_MCP].y + landmarks[HAND.RING_MCP].y) / 3,
    z: (landmarks[HAND.INDEX_MCP].z + landmarks[HAND.MIDDLE_MCP].z + landmarks[HAND.RING_MCP].z) / 3,
  }

  let origin: Landmark
  let base: Landmark

  if (isFingerSword(landmarks)) {
    const iTip = fingertipDisplayPoint(landmarks, HAND.INDEX_TIP)
    const mTip = fingertipDisplayPoint(landmarks, HAND.MIDDLE_TIP)
    origin = {
      x: (iTip.x + mTip.x) / 2,
      y: (iTip.y + mTip.y) / 2,
      z: (iTip.z + mTip.z) / 2,
    }
    base = {
      x: (landmarks[HAND.INDEX_MCP].x + landmarks[HAND.MIDDLE_MCP].x) / 2,
      y: (landmarks[HAND.INDEX_MCP].y + landmarks[HAND.MIDDLE_MCP].y) / 2,
      z: (landmarks[HAND.INDEX_MCP].z + landmarks[HAND.MIDDLE_MCP].z) / 2,
    }
  } else {
    // Fist / closed: fire from knuckle line along forearm.
    origin = knuckles
    base = wrist
  }

  let dx = origin.x - base.x
  let dy = origin.y - base.y
  let len = Math.hypot(dx, dy)

  // Foreshortened FP: finger/forearm almost disappears — aim "into the room"
  // (toward upper-center of a typical rear-camera hold).
  const fingerLen = dist(landmarks[HAND.MIDDLE_MCP], landmarks[HAND.MIDDLE_TIP])
  if (len < 0.04 || fingerLen < 0.055) {
    dx = 0.5 - origin.x
    dy = 0.28 - origin.y
    if (Math.abs(dy) < 0.08) dy = -0.85
    len = Math.hypot(dx, dy) || 1
  }

  return { origin, base, dir: { x: dx / len, y: dy / len } }
}

export function orderPolygon(points: Point2[]): Point2[] {
  if (points.length < 3) return points.slice()
  const cx = points.reduce((s, p) => s + p.x, 0) / points.length
  const cy = points.reduce((s, p) => s + p.y, 0) / points.length
  return points
    .slice()
    .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx))
}

/** Map MediaPipe landmark onto canvas with object-fit: cover. */
export function mapLandmark(lm: Landmark, view: ViewMapping): Point2 {
  const { canvasW, canvasH, videoW, videoH, mirrored } = view
  if (!videoW || !videoH) {
    return {
      x: (mirrored ? 1 - lm.x : lm.x) * canvasW,
      y: lm.y * canvasH,
    }
  }
  const scale = Math.max(canvasW / videoW, canvasH / videoH)
  const dispW = videoW * scale
  const dispH = videoH * scale
  const ox = (canvasW - dispW) / 2
  const oy = (canvasH - dispH) / 2
  const nx = mirrored ? 1 - lm.x : lm.x
  return {
    x: ox + nx * dispW,
    y: oy + lm.y * dispH,
  }
}

/** Extend past tip slightly along DIP→TIP so rings sit on visible fingertips. */
export function fingertipDisplayPoint(landmarks: Landmark[], tipId: number): Landmark {
  const tip = landmarks[tipId]
  const dipId =
    tipId === HAND.THUMB_TIP
      ? HAND.THUMB_IP
      : tipId === HAND.INDEX_TIP
        ? HAND.INDEX_DIP
        : tipId === HAND.MIDDLE_TIP
          ? HAND.MIDDLE_DIP
          : tipId === HAND.RING_TIP
            ? HAND.RING_DIP
            : HAND.PINKY_DIP
  const dip = landmarks[dipId]
  const dx = tip.x - dip.x
  const dy = tip.y - dip.y
  const dz = tip.z - dip.z
  return {
    x: tip.x + dx * 0.18,
    y: tip.y + dy * 0.18,
    z: tip.z + dz * 0.18,
  }
}

export type DualShape = {
  kind: 'l_quad' | 'span'
  points: Landmark[]
  label: string
}

export function buildDualShape(hands: Landmark[][]): DualShape | null {
  if (hands.length < 2) return null
  const a = hands[0]
  const b = hands[1]
  const cornersA = getLCorners(a)
  const cornersB = getLCorners(b)
  if (cornersA && cornersB) {
    return {
      kind: 'l_quad',
      points: [...cornersA, ...cornersB].map(cloneLandmark),
      label: '雙手 L → 四邊形',
    }
  }
  return {
    kind: 'span',
    points: [
      fingertipDisplayPoint(a, HAND.THUMB_TIP),
      fingertipDisplayPoint(a, HAND.INDEX_TIP),
      fingertipDisplayPoint(a, HAND.PINKY_TIP),
      fingertipDisplayPoint(b, HAND.THUMB_TIP),
      fingertipDisplayPoint(b, HAND.INDEX_TIP),
      fingertipDisplayPoint(b, HAND.PINKY_TIP),
    ].map(cloneLandmark),
    label: '開合展開 → 雙手圖形',
  }
}

export function handsSeparation(hands: Landmark[][]): number | null {
  if (hands.length < 2) return null
  return dist(palmCenter(hands[0]), palmCenter(hands[1]))
}

/** Nearest fingertip distance between two hands (often better for “合攏”). */
export function handsTipSeparation(hands: Landmark[][]): number | null {
  if (hands.length < 2) return null
  let min = Infinity
  for (const ia of FINGERTIP_IDS) {
    for (const ib of FINGERTIP_IDS) {
      min = Math.min(min, dist(hands[0][ia], hands[1][ib]))
    }
  }
  return Number.isFinite(min) ? min : null
}

export function fingerOpenness(landmarks: Landmark[], tip: number, pip: number, mcp: number) {
  const wrist = landmarks[HAND.WRIST]
  const tipD = dist(landmarks[tip], wrist)
  const mcpD = dist(landmarks[mcp], wrist)
  if (mcpD < 1e-6) return 0.5
  const ratio = tipD / mcpD
  return Math.max(0, Math.min(1, (ratio - 0.85) / 0.55))
}

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
