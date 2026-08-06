'use client'

import { useEffect, useRef, useState } from 'react'
import { WindowFrame } from '@/components/WindowFrame'
import {
  ELEMENT_META,
  FINGERTIP_IDS,
  FINGER_CHAINS,
  GESTURE_META,
  HAND,
  PALM_OUTLINE,
  buildDualShape,
  classifyElement,
  classifyGesture,
  cloneHand,
  fingerOpenness,
  fingertipDisplayPoint,
  handsSeparation,
  handsTipSeparation,
  magicAim,
  mapLandmark,
  orderPolygon,
  palmCenter,
  type DualShape,
  type ElementId,
  type GestureId,
  type Landmark,
  type Point2,
  type ViewMapping,
} from './gestures'

type FacingMode = 'user' | 'environment'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
  size: number
  kind: 'firework' | 'spark' | 'ripple' | 'bullet' | 'trail' | 'ember' | 'leaf' | 'drop' | 'shard' | 'dust'
}

type FlashState = { until: number; color: string }
type GlowState = { until: number; intensity: number }
type DualGate = 'idle' | 'closed' | 'ready'
type PalmSample = { t: number; x: number; y: number }
type HitTarget = {
  id: number
  x: number
  y: number
  r: number
  alive: boolean
  respawnAt: number
}
type HitMarker = { x: number; y: number; until: number; text: string }

const HOLD_MS = 280
const COOLDOWN_MS = 900
const MAGIC_COOLDOWN_MS = 1500
const ELEMENT_COOLDOWN_MS = 1200
const SHAPE_HOLD_MS = 5000
const CLOSED_HOLD_MS = 180
/** Normalized palm travel / ms to count as a throw swing. */
const SWING_SPEED = 0.00115
const SWING_DISTANCE = 0.07
const TARGET_COUNT = 3

const PREVIEW_GESTURES: GestureId[] = [
  'thumbs_up',
  'ok',
  'open_palm',
  'peace',
  'fist',
  'point',
  'magic',
]

const HAND_COLORS = [
  { bone: '#c44b28', joint: '#e4572e', palm: 'rgba(228, 87, 46, 0.22)', tip: '#ff8a65' },
  { bone: '#1f7a6e', joint: '#2a9d8f', palm: 'rgba(42, 157, 143, 0.22)', tip: '#80cbc4' },
]

function burstFireworks(particles: Particle[], w: number, h: number) {
  const cx = w * (0.35 + Math.random() * 0.3)
  const cy = h * (0.25 + Math.random() * 0.35)
  const colors = ['#ff6b35', '#ffd166', '#06d6a0', '#4cc9f0', '#f72585', '#ffffff']
  for (let i = 0; i < 56; i++) {
    const angle = (Math.PI * 2 * i) / 56 + Math.random() * 0.2
    const speed = 2.2 + Math.random() * 4.5
    particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.2,
      life: 1,
      color: colors[i % colors.length],
      size: 2 + Math.random() * 3,
      kind: 'firework',
    })
  }
}

function burstSparks(particles: Particle[], w: number, _h: number) {
  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * w,
      y: -10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 1.5 + Math.random() * 3.5,
      life: 1,
      color: i % 2 === 0 ? '#ffe66d' : '#fff8e7',
      size: 1.5 + Math.random() * 2.5,
      kind: 'spark',
    })
  }
}

function burstRipple(particles: Particle[], w: number, h: number) {
  particles.push({
    x: w / 2,
    y: h / 2,
    vx: 0,
    vy: 0,
    life: 1,
    color: 'rgba(228, 87, 46, 0.55)',
    size: 8,
    kind: 'ripple',
  })
}

function fireMagicBullets(particles: Particle[], origin: Point2, dir: Point2, count = 3) {
  const colors = ['#b388ff', '#7c4dff', '#ea80fc', '#82b1ff', '#ffffff']
  for (let i = 0; i < count; i++) {
    const spread = (i - (count - 1) / 2) * 0.12
    const cos = Math.cos(spread)
    const sin = Math.sin(spread)
    const dx = dir.x * cos - dir.y * sin
    const dy = dir.x * sin + dir.y * cos
    const speed = 9.5 + i * 0.85
    particles.push({
      x: origin.x,
      y: origin.y,
      vx: dx * speed,
      vy: dy * speed,
      life: 1.15,
      color: colors[i % colors.length],
      size: 11 - i,
      kind: 'bullet',
    })
  }
}

function impactBurst(particles: Particle[], x: number, y: number) {
  const colors = ['#ffffff', '#ea80fc', '#ffd54f', '#7c4dff', '#82b1ff']
  for (let i = 0; i < 36; i++) {
    const a = (Math.PI * 2 * i) / 36 + Math.random() * 0.2
    const s = 2.5 + Math.random() * 5.5
    particles.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: 1,
      color: colors[i % colors.length],
      size: 2 + Math.random() * 3,
      kind: 'spark',
    })
  }
  particles.push({
    x,
    y,
    vx: 0,
    vy: 0,
    life: 1,
    color: 'rgba(234, 128, 252, 0.65)',
    size: 12,
    kind: 'ripple',
  })
}

function spawnTargets(w: number, h: number, startId = 1): HitTarget[] {
  const targets: HitTarget[] = []
  for (let i = 0; i < TARGET_COUNT; i++) {
    targets.push({
      id: startId + i,
      x: w * (0.22 + Math.random() * 0.56),
      y: h * (0.18 + Math.random() * 0.45),
      r: 28 + Math.random() * 14,
      alive: true,
      respawnAt: 0,
    })
  }
  return targets
}

function castElement(particles: Particle[], w: number, h: number, element: ElementId) {
  const cx = w / 2
  const cy = h / 2
  if (element === 'fire') {
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 2 + Math.random() * 5
      particles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + 40,
        vx: Math.cos(a) * s * 0.4,
        vy: -Math.abs(Math.sin(a) * s) - 2,
        life: 1,
        color: i % 2 ? '#ff5722' : '#ffc107',
        size: 3 + Math.random() * 4,
        kind: 'ember',
      })
    }
  } else if (element === 'water') {
    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * w,
        y: -10 - Math.random() * 40,
        vx: (Math.random() - 0.5) * 1.2,
        vy: 2 + Math.random() * 4,
        life: 1,
        color: i % 2 ? '#4fc3f7' : '#0288d1',
        size: 2 + Math.random() * 3,
        kind: 'drop',
      })
    }
    particles.push({
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      life: 1,
      color: 'rgba(79, 195, 247, 0.5)',
      size: 10,
      kind: 'ripple',
    })
  } else if (element === 'wood') {
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: cx + (Math.random() - 0.5) * w * 0.5,
        y: h + 10,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -2 - Math.random() * 3.5,
        life: 1,
        color: i % 2 ? '#66bb6a' : '#2e7d32',
        size: 3 + Math.random() * 3,
        kind: 'leaf',
      })
    }
  } else if (element === 'metal') {
    for (let i = 0; i < 60; i++) {
      const a = (Math.PI * 2 * i) / 60
      const s = 3 + Math.random() * 6
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1,
        color: i % 2 ? '#eceff1' : '#90a4ae',
        size: 2 + Math.random() * 2.5,
        kind: 'shard',
      })
    }
  } else {
    for (let i = 0; i < 65; i++) {
      particles.push({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + 30,
        vx: (Math.random() - 0.5) * 4,
        vy: -1 - Math.random() * 3,
        life: 1,
        color: i % 2 ? '#8d6e63' : '#a1887f',
        size: 2 + Math.random() * 4,
        kind: 'dust',
      })
    }
    burstRipple(particles, w, h)
  }
}

function depthScale(z: number) {
  return Math.max(0.7, Math.min(1.45, 1.05 - z * 3.2))
}

function drawBone(
  ctx: CanvasRenderingContext2D,
  a: Point2,
  b: Point2,
  widthA: number,
  widthB: number,
  color: string,
) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  ctx.beginPath()
  ctx.moveTo(a.x + nx * widthA, a.y + ny * widthA)
  ctx.lineTo(b.x + nx * widthB, b.y + ny * widthB)
  ctx.lineTo(b.x - nx * widthB, b.y - ny * widthB)
  ctx.lineTo(a.x - nx * widthA, a.y - ny * widthA)
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
}

function drawAdaptiveSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  view: ViewMapping,
  palette = HAND_COLORS[0],
) {
  const pt = (i: number) => mapLandmark(landmarks[i], view)
  const scaleOf = (i: number) => depthScale(landmarks[i].z)

  const palm = PALM_OUTLINE.map((i) => pt(i))
  ctx.beginPath()
  ctx.moveTo(palm[0].x, palm[0].y)
  for (let i = 1; i < palm.length; i++) ctx.lineTo(palm[i].x, palm[i].y)
  ctx.closePath()
  ctx.fillStyle = palette.palm
  ctx.fill()
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.55)'
  ctx.lineWidth = 2
  ctx.stroke()

  const openness = [
    fingerOpenness(landmarks, HAND.THUMB_TIP, HAND.THUMB_IP, HAND.THUMB_MCP),
    fingerOpenness(landmarks, HAND.INDEX_TIP, HAND.INDEX_PIP, HAND.INDEX_MCP),
    fingerOpenness(landmarks, HAND.MIDDLE_TIP, HAND.MIDDLE_PIP, HAND.MIDDLE_MCP),
    fingerOpenness(landmarks, HAND.RING_TIP, HAND.RING_PIP, HAND.RING_MCP),
    fingerOpenness(landmarks, HAND.PINKY_TIP, HAND.PINKY_PIP, HAND.PINKY_MCP),
  ]

  FINGER_CHAINS.forEach((chain, fingerIdx) => {
    const open = openness[fingerIdx]
    const baseW = (fingerIdx === 0 ? 5.5 : fingerIdx === 4 ? 4.2 : 5) * (0.72 + open * 0.45)
    for (let i = 0; i < chain.length - 1; i++) {
      const ia = chain[i]
      const ib = chain[i + 1]
      const tipPt =
        i === chain.length - 2 && (FINGERTIP_IDS as readonly number[]).includes(ib)
          ? mapLandmark(fingertipDisplayPoint(landmarks, ib), view)
          : pt(ib)
      const taper = 1 - i * 0.14
      const wa = (baseW * taper * scaleOf(ia)) / 2
      const wb = (baseW * (taper - 0.1) * scaleOf(ib)) / 2
      drawBone(ctx, pt(ia), tipPt, Math.max(wa, 1.2), Math.max(wb, 1), palette.bone)
    }
  })

  const mcpJoints = new Set<number>([
    HAND.INDEX_MCP,
    HAND.MIDDLE_MCP,
    HAND.RING_MCP,
    HAND.PINKY_MCP,
    HAND.THUMB_MCP,
  ])

  for (let i = 0; i < landmarks.length; i++) {
    const isTip = (FINGERTIP_IDS as readonly number[]).includes(i)
    const p = isTip ? mapLandmark(fingertipDisplayPoint(landmarks, i), view) : pt(i)
    const s = scaleOf(i)
    let r = 3.2 * s
    if (i === HAND.WRIST) r = 7.5 * s
    else if (mcpJoints.has(i)) r = 5.2 * s
    else if (isTip) r = 4.2 * s

    ctx.beginPath()
    ctx.fillStyle = isTip ? palette.tip : palette.joint
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 253, 248, 0.9)'
    ctx.lineWidth = isTip ? 2.2 : 1.4
    ctx.stroke()
  }
}

function drawShapePolygon(
  ctx: CanvasRenderingContext2D,
  points: Point2[],
  kind: DualShape['kind'],
) {
  if (points.length < 3) return
  const ordered = orderPolygon(points)
  ctx.beginPath()
  ctx.moveTo(ordered[0].x, ordered[0].y)
  for (let i = 1; i < ordered.length; i++) ctx.lineTo(ordered[i].x, ordered[i].y)
  ctx.closePath()

  if (kind === 'l_quad') {
    ctx.fillStyle = 'rgba(228, 87, 46, 0.28)'
    ctx.strokeStyle = 'rgba(228, 87, 46, 0.95)'
    ctx.lineWidth = 4
  } else {
    ctx.fillStyle = 'rgba(124, 77, 255, 0.2)'
    ctx.strokeStyle = 'rgba(124, 77, 255, 0.9)'
    ctx.lineWidth = 3
  }
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = kind === 'l_quad' ? '#e4572e' : '#7c4dff'
  for (const p of ordered) {
    ctx.beginPath()
    ctx.arc(p.x, p.y, 7, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#fffdf8'
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

function sampleDualLPoints(w: number, h: number): Point2[] {
  return orderPolygon([
    { x: w * 0.28, y: h * 0.32 },
    { x: w * 0.38, y: h * 0.62 },
    { x: w * 0.72, y: h * 0.28 },
    { x: w * 0.66, y: h * 0.68 },
  ])
}

export function HandGesturesTool() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLCanvasElement>(null)
  const effectRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const landmarkerRef = useRef<import('@mediapipe/tasks-vision').HandLandmarker | null>(null)
  const rafRef = useRef(0)
  const streamRef = useRef<MediaStream | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const flashRef = useRef<FlashState | null>(null)
  const glowRef = useRef<GlowState | null>(null)
  const laserRef = useRef<{ x: number; y: number; until: number } | null>(null)
  const demoShapeRef = useRef<{ points: Point2[]; until: number; kind: DualShape['kind'] } | null>(
    null,
  )
  const activeShapeRef = useRef<{ shape: DualShape; until: number } | null>(null)
  const dualGateRef = useRef<DualGate>('idle')
  const closedSinceRef = useRef(0)
  const closedSepRef = useRef(0)
  const lastDetectAtRef = useRef(0)
  const lastVideoTimeRef = useRef(-1)
  const facingRef = useRef<FacingMode>('environment')
  const mirroredRef = useRef(false)
  const gateHintRef = useRef<string | null>(null)
  const palmTrailRef = useRef<PalmSample[]>([])
  const magicReadyRef = useRef(false)
  const lastMagicCastRef = useRef(0)
  const chargePalmRef = useRef<Point2 | null>(null)
  const targetsRef = useRef<HitTarget[]>([])
  const hitMarkersRef = useRef<HitMarker[]>([])

  const holdGestureRef = useRef<GestureId>('none')
  const holdSinceRef = useRef(0)
  const lastFiredRef = useRef<{ id: string; at: number }>({ id: 'none', at: 0 })
  const handsRef = useRef<Landmark[][]>([])
  const shapeLabelRef = useRef<string | null>(null)
  const elementHoldRef = useRef<ElementId | null>(null)
  const elementSinceRef = useRef(0)

  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gesture, setGesture] = useState<GestureId>('none')
  const [element, setElement] = useState<ElementId | null>(null)
  const [shapeLabel, setShapeLabel] = useState<string | null>(null)
  const [gateHint, setGateHintState] = useState<string | null>(null)
  const [facing, setFacing] = useState<FacingMode>('environment')
  const [shake, setShake] = useState(false)
  const [magicArmed, setMagicArmed] = useState(false)
  const [cooldownLeft, setCooldownLeft] = useState(0)
  const [hitCount, setHitCount] = useState(0)
  const [status, setStatus] = useState('尚未啟動鏡頭')

  const setGateHint = (hint: string | null) => {
    gateHintRef.current = hint
    setGateHintState(hint)
  }

  const setShapeLabelSafe = (label: string | null) => {
    if (shapeLabelRef.current === label) return
    shapeLabelRef.current = label
    setShapeLabel(label)
  }

  const currentView = (): ViewMapping => {
    const stage = stageRef.current
    const video = videoRef.current
    return {
      canvasW: stage?.clientWidth || overlayRef.current?.width || 640,
      canvasH: stage?.clientHeight || overlayRef.current?.height || 360,
      videoW: video?.videoWidth || 0,
      videoH: video?.videoHeight || 0,
      mirrored: mirroredRef.current,
    }
  }

  const triggerEffect = (id: GestureId, hand?: Landmark[]) => {
    const canvas = effectRef.current
    if (!canvas) return
    const w = canvas.width
    const h = canvas.height
    const now = performance.now()
    const view = currentView()

    if (id === 'thumbs_up') {
      burstFireworks(particlesRef.current, w, h)
      setTimeout(() => burstFireworks(particlesRef.current, w, h), 180)
      setTimeout(() => burstFireworks(particlesRef.current, w, h), 360)
    } else if (id === 'ok') {
      flashRef.current = { until: now + 420, color: 'rgba(255, 255, 255, 0.72)' }
      setTimeout(() => {
        flashRef.current = { until: performance.now() + 220, color: 'rgba(79, 195, 247, 0.45)' }
      }, 160)
      setTimeout(() => {
        flashRef.current = { until: performance.now() + 180, color: 'rgba(255, 255, 255, 0.5)' }
      }, 320)
    } else if (id === 'open_palm') {
      glowRef.current = { until: now + 1200, intensity: 1 }
    } else if (id === 'peace') {
      burstSparks(particlesRef.current, w, h)
      setTimeout(() => burstSparks(particlesRef.current, w, h), 200)
    } else if (id === 'fist') {
      burstRipple(particlesRef.current, w, h)
      setShake(true)
      setTimeout(() => setShake(false), 450)
    } else if (id === 'point') {
      const lm = hand ?? handsRef.current[0]
      if (lm) {
        const p = mapLandmark(fingertipDisplayPoint(lm, HAND.INDEX_TIP), view)
        laserRef.current = { x: p.x, y: p.y, until: now + 700 }
      } else {
        laserRef.current = { x: w * 0.5, y: h * 0.35, until: now + 700 }
      }
    } else if (id === 'magic') {
      const lm = hand ?? handsRef.current[0]
      if (lm) {
        const aim = magicAim(lm)
        const origin = mapLandmark(aim.origin, view)
        const dirTip = mapLandmark(
          {
            x: aim.origin.x + aim.dir.x * 0.1,
            y: aim.origin.y + aim.dir.y * 0.1,
            z: aim.origin.z,
          },
          view,
        )
        const dx = dirTip.x - origin.x
        const dy = dirTip.y - origin.y
        const len = Math.hypot(dx, dy) || 1
        fireMagicBullets(particlesRef.current, origin, { x: dx / len, y: dy / len }, 4)
      } else {
        fireMagicBullets(particlesRef.current, { x: w * 0.5, y: h * 0.55 }, { x: 0, y: -1 }, 4)
      }
      lastMagicCastRef.current = now
      magicReadyRef.current = false
      setMagicArmed(false)
      flashRef.current = { until: now + 180, color: 'rgba(124, 77, 255, 0.35)' }
    } else if (id === 'l_shape') {
      flashRef.current = { until: now + 220, color: 'rgba(228, 87, 46, 0.22)' }
    }
  }

  const triggerElement = (id: ElementId) => {
    const canvas = effectRef.current
    if (!canvas) return
    castElement(particlesRef.current, canvas.width, canvas.height, id)
    const meta = ELEMENT_META[id]
    flashRef.current = { until: performance.now() + 280, color: `${meta.color}55` }
    if (id === 'earth' || id === 'fire') {
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
    setElement(id)
    setStatus(`五行 · ${meta.label}：${meta.effect}`)
  }

  const considerGesture = (next: GestureId, hand?: Landmark[]) => {
    const now = performance.now()
    if (next !== holdGestureRef.current) {
      holdGestureRef.current = next
      holdSinceRef.current = now
      setGesture(next)
      return
    }
    setGesture(next)
    // Magic is cast by swing, not auto-fire on hold.
    if (next === 'none' || next === 'l_shape' || next === 'magic') return
    if (now - holdSinceRef.current < HOLD_MS) return
    const last = lastFiredRef.current
    if (last.id === next && now - last.at < COOLDOWN_MS) return
    lastFiredRef.current = { id: next, at: now }
    triggerEffect(next, hand)
  }

  const castMagicFromSwing = (hand: Landmark[], dirNorm: Point2, view: ViewMapping) => {
    const now = performance.now()
    const originLm = palmCenter(hand)
    const origin = mapLandmark(originLm, view)
    const ahead = mapLandmark(
      { x: originLm.x + dirNorm.x * 0.08, y: originLm.y + dirNorm.y * 0.08, z: originLm.z },
      view,
    )
    let dx = ahead.x - origin.x
    let dy = ahead.y - origin.y
    const len = Math.hypot(dx, dy) || 1
    dx /= len
    dy /= len
    fireMagicBullets(particlesRef.current, origin, { x: dx, y: dy }, 5)
    flashRef.current = { until: now + 200, color: 'rgba(124, 77, 255, 0.4)' }
    lastMagicCastRef.current = now
    lastFiredRef.current = { id: 'magic', at: now }
    magicReadyRef.current = false
    setMagicArmed(false)
    palmTrailRef.current = []
    chargePalmRef.current = null
    setStatus('揮出！魔法發射')
  }

  const updateMagicSwing = (hand: Landmark[], view: ViewMapping) => {
    const now = performance.now()
    const coolLeft = MAGIC_COOLDOWN_MS - (now - lastMagicCastRef.current)
    if (coolLeft > 0) {
      magicReadyRef.current = false
      setMagicArmed(false)
      chargePalmRef.current = null
      palmTrailRef.current = []
      setCooldownLeft(coolLeft)
      setGesture('magic')
      setStatus(`魔法冷卻 ${(coolLeft / 1000).toFixed(1)}s`)
      return
    }
    setCooldownLeft(0)

    const palm = palmCenter(hand)
    chargePalmRef.current = mapLandmark(palm, view)
    palmTrailRef.current.push({ t: now, x: palm.x, y: palm.y })
    palmTrailRef.current = palmTrailRef.current.filter((s) => now - s.t <= 220)

    magicReadyRef.current = true
    setMagicArmed(true)
    setGesture('magic')

    const trail = palmTrailRef.current
    if (trail.length >= 3) {
      const a = trail[0]
      const b = trail[trail.length - 1]
      const dt = b.t - a.t
      const travel = Math.hypot(b.x - a.x, b.y - a.y)
      if (dt > 35 && travel > SWING_DISTANCE) {
        const speed = travel / dt
        if (speed >= SWING_SPEED) {
          const dir = { x: (b.x - a.x) / travel, y: (b.y - a.y) / travel }
          castMagicFromSwing(hand, dir, view)
          return
        }
      }
    }
    setStatus('魔法蓄力中 — 保持手勢，向前用力揮出')
  }

  const considerElement = (next: ElementId | null) => {
    const now = performance.now()
    if (!next) {
      elementHoldRef.current = null
      setElement(null)
      return
    }
    if (elementHoldRef.current !== next) {
      elementHoldRef.current = next
      elementSinceRef.current = now
      setElement(next)
      return
    }
    setElement(next)
    if (now - elementSinceRef.current < HOLD_MS) return
    const last = lastFiredRef.current
    if (last.id === `el:${next}` && now - last.at < ELEMENT_COOLDOWN_MS) return
    lastFiredRef.current = { id: `el:${next}`, at: now }
    triggerElement(next)
  }

  const updateDualGate = (hands: Landmark[][]) => {
    const palmSep = handsSeparation(hands)
    const tipSep = handsTipSeparation(hands)
    const now = performance.now()

    if (palmSep == null || tipSep == null) {
      dualGateRef.current = 'idle'
      closedSepRef.current = 0
      setGateHint(null)
      if (activeShapeRef.current && activeShapeRef.current.until < now) {
        activeShapeRef.current = null
        setShapeLabelSafe(null)
      }
      return
    }

    // Adaptive: tip distance is easier to hit on phone selfies.
    const closeScore = Math.min(palmSep, tipSep * 1.35)
    const isClosed = closeScore < 0.28 || tipSep < 0.14
    const openedEnough =
      closedSepRef.current > 0 &&
      (closeScore > closedSepRef.current * 1.55 || tipSep > closedSepRef.current * 1.8 + 0.05)

    if (isClosed) {
      if (dualGateRef.current !== 'closed') {
        closedSinceRef.current = now
        closedSepRef.current = Math.max(closeScore, 0.06)
      } else {
        closedSepRef.current = Math.min(closedSepRef.current, closeScore)
      }
      dualGateRef.current = 'closed'
      const held = now - closedSinceRef.current
      setGateHint(held < CLOSED_HOLD_MS ? '合攏中…' : '已合攏 — 雙手再分開')
      return
    }

    if (
      dualGateRef.current === 'closed' &&
      now - closedSinceRef.current >= CLOSED_HOLD_MS &&
      openedEnough
    ) {
      const shape = buildDualShape(hands)
      if (shape) {
        activeShapeRef.current = { shape, until: now + SHAPE_HOLD_MS }
        setShapeLabelSafe(shape.label)
        setGateHint('已展開圖形')
        setStatus(shape.label)
        dualGateRef.current = 'ready'
        const canvas = effectRef.current
        if (canvas) burstSparks(particlesRef.current, canvas.width, canvas.height)
      } else {
        dualGateRef.current = 'idle'
      }
      return
    }

    if (dualGateRef.current === 'ready') {
      setGateHint('可再合攏 → 分開重畫')
      if (isClosed) {
        dualGateRef.current = 'closed'
        closedSinceRef.current = now
        closedSepRef.current = Math.max(closeScore, 0.06)
        setGateHint('合攏中…')
      }
    } else {
      dualGateRef.current = 'idle'
      setGateHint('雙手靠近合攏，再分開才會出現圖形')
    }

    if (activeShapeRef.current && activeShapeRef.current.until < now) {
      activeShapeRef.current = null
      setShapeLabelSafe(null)
      if (dualGateRef.current === 'ready') dualGateRef.current = 'idle'
    }
  }

  const paintEffects = () => {
    const canvas = effectRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const w = canvas.width
    const h = canvas.height
    const now = performance.now()

    ctx.clearRect(0, 0, w, h)

    const glow = glowRef.current
    if (glow && glow.until > now) {
      const t = (glow.until - now) / 1200
      const pulse = 0.35 + 0.25 * Math.sin(now / 120)
      const g = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, Math.max(w, h) * 0.55)
      g.addColorStop(0, `rgba(255, 236, 179, ${0.45 * t * pulse})`)
      g.addColorStop(0.55, `rgba(184, 212, 232, ${0.28 * t})`)
      g.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    } else if (glow) {
      glowRef.current = null
    }

    const flash = flashRef.current
    if (flash && flash.until > now) {
      ctx.fillStyle = flash.color
      ctx.fillRect(0, 0, w, h)
    } else if (flash) {
      flashRef.current = null
    }

    const laser = laserRef.current
    if (laser && laser.until > now) {
      const alpha = (laser.until - now) / 700
      ctx.strokeStyle = `rgba(228, 87, 46, ${0.85 * alpha})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(laser.x, 0)
      ctx.lineTo(laser.x, h)
      ctx.stroke()
      ctx.fillStyle = `rgba(255, 209, 102, ${alpha})`
      ctx.beginPath()
      ctx.arc(laser.x, laser.y, 10, 0, Math.PI * 2)
      ctx.fill()
    } else if (laser) {
      laserRef.current = null
    }

    const demo = demoShapeRef.current
    if (demo && demo.until > now) {
      drawShapePolygon(ctx, demo.points, demo.kind)
    } else if (demo) {
      demoShapeRef.current = null
    }

    // Ensure targets exist once canvas has size.
    if (targetsRef.current.length === 0 && w > 10 && h > 10) {
      targetsRef.current = spawnTargets(w, h)
    }

    // Respawn / draw hit targets.
    for (const t of targetsRef.current) {
      if (!t.alive && t.respawnAt > 0 && now >= t.respawnAt) {
        t.alive = true
        t.x = w * (0.2 + Math.random() * 0.6)
        t.y = h * (0.15 + Math.random() * 0.5)
        t.r = 28 + Math.random() * 14
        t.respawnAt = 0
      }
      if (!t.alive) continue
      const pulse = 1 + 0.08 * Math.sin(now / 140 + t.id)
      const g = ctx.createRadialGradient(t.x, t.y, 4, t.x, t.y, t.r * pulse)
      g.addColorStop(0, 'rgba(255,255,255,0.95)')
      g.addColorStop(0.35, 'rgba(255, 213, 79, 0.85)')
      g.addColorStop(1, 'rgba(255, 87, 34, 0.05)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(t.x, t.y, t.r * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Charged magic orb at palm.
    const charge = chargePalmRef.current
    if (magicReadyRef.current && charge) {
      const pulse = 1 + 0.15 * Math.sin(now / 90)
      const g = ctx.createRadialGradient(charge.x, charge.y, 2, charge.x, charge.y, 34 * pulse)
      g.addColorStop(0, '#ffffff')
      g.addColorStop(0.4, 'rgba(179, 136, 255, 0.9)')
      g.addColorStop(1, 'rgba(124, 77, 255, 0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(charge.x, charge.y, 34 * pulse, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.75)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(charge.x, charge.y, 18 * pulse, 0, Math.PI * 2)
      ctx.stroke()
    }

    const next: Particle[] = []
    const trails: Particle[] = []
    const impacts: Particle[] = []
    let hitsThisFrame = 0
    for (const p of particlesRef.current) {
      if (p.kind === 'ripple') {
        const radius = (1 - p.life) * Math.min(w, h) * 0.35
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(radius, 4), 0, Math.PI * 2)
        ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${0.55 * p.life})`)
        ctx.lineWidth = 6 * p.life
        ctx.stroke()
        p.life -= 0.03
      } else if (p.kind === 'bullet') {
        trails.push({
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          life: 0.45,
          color: p.color,
          size: p.size * 0.55,
          kind: 'trail',
        })
        p.x += p.vx
        p.y += p.vy
        p.life -= 0.01

        // Collision with targets → hit feedback.
        for (const t of targetsRef.current) {
          if (!t.alive) continue
          if (Math.hypot(p.x - t.x, p.y - t.y) <= t.r + p.size * 0.6) {
            t.alive = false
            t.respawnAt = now + 900
            impactBurst(impacts, t.x, t.y)
            hitMarkersRef.current.push({ x: t.x, y: t.y - 18, until: now + 700, text: 'HIT!' })
            flashRef.current = { until: now + 140, color: 'rgba(255, 213, 79, 0.45)' }
            hitsThisFrame += 1
            p.life = 0
            break
          }
        }

        if (p.life > 0) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 1.8)
          g.addColorStop(0, '#ffffff')
          g.addColorStop(0.35, p.color)
          g.addColorStop(1, 'rgba(124, 77, 255, 0)')
          ctx.fillStyle = g
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#fff'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.45, 0, Math.PI * 2)
          ctx.fill()
        }
      } else if (p.kind === 'trail') {
        p.life -= 0.04
        ctx.globalAlpha = Math.max(p.life, 0) * 0.55
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      } else {
        p.x += p.vx
        p.y += p.vy
        if (p.kind === 'firework' || p.kind === 'ember' || p.kind === 'dust') p.vy += 0.08
        if (p.kind === 'leaf') {
          p.x += Math.sin(now / 120 + p.y) * 0.6
          p.vy += 0.02
        }
        if (p.kind === 'drop') p.vy += 0.05
        p.life -= p.kind === 'spark' || p.kind === 'leaf' ? 0.016 : 0.014
        ctx.globalAlpha = Math.max(p.life, 0)
        ctx.fillStyle = p.color
        if (p.kind === 'shard') {
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.vx + p.vy)
          ctx.fillRect(-p.size, -p.size * 0.35, p.size * 2, p.size * 0.7)
          ctx.restore()
        } else if (p.kind === 'leaf') {
          ctx.beginPath()
          ctx.ellipse(p.x, p.y, p.size, p.size * 0.55, p.vx, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.globalAlpha = 1
      }
      if (p.life > 0 && p.x > -40 && p.x < w + 40 && p.y > -40 && p.y < h + 40) next.push(p)
    }
    particlesRef.current = next.concat(trails, impacts)

    if (hitsThisFrame > 0) {
      setHitCount((c) => c + hitsThisFrame)
      setShake(true)
      setTimeout(() => setShake(false), 280)
      setStatus(`命中 ×${hitsThisFrame}！`)
    }

    // Floating HIT markers.
    hitMarkersRef.current = hitMarkersRef.current.filter((m) => m.until > now)
    for (const m of hitMarkersRef.current) {
      const alpha = Math.max(0, (m.until - now) / 700)
      ctx.globalAlpha = alpha
      ctx.fillStyle = '#fff8e1'
      ctx.strokeStyle = '#e65100'
      ctx.lineWidth = 3
      ctx.font = '700 28px sans-serif'
      ctx.textAlign = 'center'
      ctx.strokeText(m.text, m.x, m.y - (1 - alpha) * 24)
      ctx.fillText(m.text, m.x, m.y - (1 - alpha) * 24)
      ctx.globalAlpha = 1
    }
  }

  const syncCanvasSize = () => {
    const stage = stageRef.current
    const overlay = overlayRef.current
    const effect = effectRef.current
    if (!stage || !overlay || !effect) return
    const w = stage.clientWidth
    const h = stage.clientHeight
    for (const c of [overlay, effect]) {
      if (c.width !== w || c.height !== h) {
        c.width = w
        c.height = h
      }
    }
  }

  const paintOverlay = (hands: Landmark[][], view: ViewMapping) => {
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    hands.forEach((hand, i) => {
      drawAdaptiveSkeleton(ctx, hand, view, HAND_COLORS[i % HAND_COLORS.length])
    })

    const active = activeShapeRef.current
    if (active && active.until > performance.now()) {
      const screenPts = active.shape.points.map((p) => mapLandmark(p, view))
      drawShapePolygon(ctx, screenPts, active.shape.kind)
    }
  }

  const stopTracksOnly = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    stopTracksOnly()
    landmarkerRef.current?.close()
    landmarkerRef.current = null
    setRunning(false)
    setStatus('已停止')
    setGesture('none')
    setElement(null)
    setShapeLabelSafe(null)
    setGateHint(null)
    setMagicArmed(false)
    magicReadyRef.current = false
    chargePalmRef.current = null
    palmTrailRef.current = []
    activeShapeRef.current = null
    dualGateRef.current = 'idle'
    handsRef.current = []
    targetsRef.current = []
    hitMarkersRef.current = []
    const overlay = overlayRef.current
    if (overlay) {
      const ctx = overlay.getContext('2d')
      ctx?.clearRect(0, 0, overlay.width, overlay.height)
    }
  }

  const openStream = async (mode: FacingMode) => {
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: { ideal: mode },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    }
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (firstErr) {
      if (mode === 'environment') throw firstErr
      return navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
    }
  }

  const ensureLandmarker = async () => {
    if (landmarkerRef.current) return landmarkerRef.current
    const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
    )
    const landmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numHands: 2,
    })
    landmarkerRef.current = landmarker
    return landmarker
  }

  const startLoop = (video: HTMLVideoElement) => {
    cancelAnimationFrame(rafRef.current)
    const loop = () => {
      rafRef.current = requestAnimationFrame(loop)
      syncCanvasSize()
      paintEffects()

      const lm = landmarkerRef.current
      if (!lm || !video) return
      if (video.readyState < 2) return

      const now = performance.now()
      const view = currentView()

      if (video.currentTime === lastVideoTimeRef.current) {
        paintOverlay(handsRef.current, view)
        return
      }
      lastVideoTimeRef.current = video.currentTime
      lastDetectAtRef.current = now

      const result = lm.detectForVideo(video, now)
      const hands = (result.landmarks ?? [])
        .filter((h) => h.length >= 21)
        .map((h) => cloneHand(h as Landmark[]))
      handsRef.current = hands
      updateDualGate(hands)
      paintOverlay(hands, view)

      if (hands.length === 0) {
        magicReadyRef.current = false
        setMagicArmed(false)
        chargePalmRef.current = null
        palmTrailRef.current = []
        considerGesture('none')
        considerElement(null)
        return
      }

      const el = classifyElement(hands)
      if (el) {
        magicReadyRef.current = false
        setMagicArmed(false)
        chargePalmRef.current = null
        considerElement(el)
        setStatus(`五行組合 · ${ELEMENT_META[el].label}（${ELEMENT_META[el].combo}）`)
        return
      }
      considerElement(null)

      if (activeShapeRef.current && activeShapeRef.current.until > now) {
        setGesture(activeShapeRef.current.shape.kind === 'l_quad' ? 'l_shape' : 'open_palm')
      }

      const ids = hands.map((h) => classifyGesture(h))
      const magicIdx = ids.findIndex((id) => id === 'magic')
      if (magicIdx >= 0) {
        updateMagicSwing(hands[magicIdx], view)
        return
      }

      magicReadyRef.current = false
      setMagicArmed(false)
      chargePalmRef.current = null
      palmTrailRef.current = []

      const primaryIdx = ids.findIndex((id) => id !== 'none' && id !== 'l_shape')
      const primary = primaryIdx >= 0 ? ids[primaryIdx] : ids.find((id) => id !== 'none') ?? 'none'
      const hand = primaryIdx >= 0 ? hands[primaryIdx] : hands[0]
      considerGesture(primary, hand)

      const coolLeft = MAGIC_COOLDOWN_MS - (now - lastMagicCastRef.current)
      if (coolLeft > 0) setCooldownLeft(coolLeft)
      else setCooldownLeft(0)

      if (gateHintRef.current) {
        setStatus(gateHintRef.current)
      } else if (primary !== 'none') {
        setStatus(`追蹤中 — ${GESTURE_META[primary].label}`)
      } else {
        setStatus('追蹤中 — 比魔法手勢蓄力，揮出發射')
      }
    }
    rafRef.current = requestAnimationFrame(loop)
  }

  const applyFacing = (mode: FacingMode) => {
    facingRef.current = mode
    mirroredRef.current = mode === 'user'
    setFacing(mode)
    const video = videoRef.current
    if (video) {
      video.style.transform = mode === 'user' ? 'scaleX(-1)' : 'none'
    }
  }

  const startCamera = async (mode: FacingMode = facingRef.current) => {
    setError(null)
    setLoading(true)
    setStatus('載入手部模型中…')
    try {
      await ensureLandmarker()
      const stream = await openStream(mode)
      stopTracksOnly()
      streamRef.current = stream
      const video = videoRef.current
      if (!video) throw new Error('找不到 video 元素')
      video.srcObject = stream
      applyFacing(mode)
      await video.play()

      setRunning(true)
      setStatus('後置鏡頭追蹤中 — 魔法手勢蓄力後揮出發射')
      setLoading(false)
      lastVideoTimeRef.current = -1
      lastDetectAtRef.current = 0
      targetsRef.current = []
      startLoop(video)
    } catch (err) {
      console.error(err)
      setLoading(false)
      setRunning(false)
      const message = err instanceof Error ? err.message : '無法啟動鏡頭或載入模型'
      if (/NotAllowedError|Permission/i.test(String(err))) {
        setError('需要允許攝影機權限才能追蹤手部。')
      } else if (/NotFoundError|Requested device not found|DevicesNotFound|could not start/i.test(String(err))) {
        setError(
          mode === 'environment'
            ? '找不到後置鏡頭。可改回前置，或用下方按鈕預覽。'
            : '找不到攝影機。可先用下方按鈕預覽特效，有鏡頭再開啟追蹤。',
        )
      } else {
        setError(message)
      }
      setStatus('啟動失敗')
      stopCamera()
    }
  }

  const switchCamera = async () => {
    if (!running || switching) return
    const next: FacingMode = facingRef.current === 'user' ? 'environment' : 'user'
    setSwitching(true)
    setError(null)
    setStatus(next === 'user' ? '切換前置鏡頭…' : '切換後置鏡頭…')
    try {
      const stream = await openStream(next)
      stopTracksOnly()
      streamRef.current = stream
      const video = videoRef.current
      if (!video) throw new Error('找不到 video 元素')
      video.srcObject = stream
      applyFacing(next)
      await video.play()
      lastVideoTimeRef.current = -1
      lastDetectAtRef.current = 0
      setStatus(next === 'user' ? '前置鏡頭' : '後置鏡頭')
    } catch (err) {
      console.error(err)
      setError(
        next === 'environment'
          ? '這台裝置可能沒有後置鏡頭，或瀏覽器不支援切換。'
          : '無法切換回前置鏡頭。',
      )
      try {
        const stream = await openStream(facingRef.current)
        stopTracksOnly()
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          applyFacing(facingRef.current)
          await video.play()
        }
      } catch {
        /* keep error */
      }
    } finally {
      setSwitching(false)
    }
  }

  useEffect(() => {
    let id = 0
    const tick = () => {
      id = requestAnimationFrame(tick)
      if (!rafRef.current) {
        syncCanvasSize()
        paintEffects()
      }
    }
    id = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(id)
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
      streamRef.current?.getTracks().forEach((t) => t.stop())
      landmarkerRef.current?.close()
    }
  }, [])

  const meta = GESTURE_META[gesture]
  const elMeta = element ? ELEMENT_META[element] : null
  const badgeTitle = elMeta
    ? `五行 · ${elMeta.label}`
    : magicArmed
      ? '魔法蓄力'
      : shapeLabel ?? meta.label
  const badgeSub = elMeta
    ? elMeta.effect
    : cooldownLeft > 0
      ? `冷卻 ${(cooldownLeft / 1000).toFixed(1)}s`
      : magicArmed
        ? '向前揮出發射'
        : shapeLabel
          ? '合攏→分開觸發'
          : meta.effect

  return (
    <div className="tool-page tool-page--camera">
      <WindowFrame
        title="手勢特效.exe"
        footer={status}
        toolbar={<span className="win__menu">Rear · Swing Magic · Hits</span>}
      >
        <div className="hand-tool">
          <p className="hand-tool__intro">
            預設後置鏡頭。比出魔法手勢（拇指＋小指）蓄力，再用力揮出即可發射；打中金色目標會有 HIT 回饋。魔法冷卻約 1.5 秒。
          </p>

          <div className="hand-tool__actions">
            {!running ? (
              <button
                type="button"
                className="btn btn--primary"
                disabled={loading}
                onClick={() => void startCamera('environment')}
              >
                {loading ? '載入中…' : '開啟後置鏡頭'}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn--ghost" onClick={stopCamera}>
                  關閉鏡頭
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  disabled={switching}
                  onClick={() => void switchCamera()}
                >
                  {switching
                    ? '切換中…'
                    : facing === 'environment'
                      ? '切換前置鏡頭'
                      : '切換後置鏡頭'}
                </button>
              </>
            )}
            <span className="hand-tool__facing muted">
              目前：{facing === 'user' ? '前置（鏡像）' : '後置'}
              {hitCount > 0 ? ` · 命中 ${hitCount}` : ''}
            </span>
          </div>

          {error ? <p className="hand-tool__error">{error}</p> : null}
          {gateHint ? <p className="hand-tool__gate muted">{gateHint}</p> : null}

          <div
            ref={stageRef}
            className={`hand-tool__stage${shake ? ' is-shake' : ''}${running ? ' is-live' : ''}${
              facing === 'user' ? ' is-mirrored' : ''
            }`}
          >
            <video ref={videoRef} className="hand-tool__video" playsInline muted />
            <canvas ref={overlayRef} className="hand-tool__overlay" />
            <canvas ref={effectRef} className="hand-tool__effects" />
            {!running ? (
              <div className="hand-tool__placeholder">
                <p>開啟後置鏡頭，把手放進畫面</p>
                <p className="muted">魔法蓄力 → 揮出發射 · 打金色目標</p>
              </div>
            ) : null}
            <div className="hand-tool__badge" aria-live="polite">
              <strong>{badgeTitle}</strong>
              <span>{badgeSub}</span>
            </div>
          </div>

          <div className="hand-tool__legend">
            <p className="hand-tool__legend-title">單手特效</p>
            <ul>
              {PREVIEW_GESTURES.map((id) => (
                <li key={id}>
                  <span>{GESTURE_META[id].label}</span>
                  <span className="muted">→ {GESTURE_META[id].effect}</span>
                </li>
              ))}
              <li>
                <span>雙手合攏 → 分開</span>
                <span className="muted">→ 才出現雙手圖形</span>
              </li>
            </ul>
            <p className="muted hand-tool__hint">
              魔法：拇指＋小指蓄力，掌心紫球出現後向前揮出；打中金色目標會顯示 HIT。冷卻約 1.5 秒。
            </p>
          </div>

          <div className="hand-tool__legend">
            <p className="hand-tool__legend-title">五行組合魔法</p>
            <ul>
              {(Object.keys(ELEMENT_META) as ElementId[]).map((id) => (
                <li key={id}>
                  <span>
                    {ELEMENT_META[id].label}（{ELEMENT_META[id].combo}）
                  </span>
                  <span className="muted">→ {ELEMENT_META[id].effect}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hand-tool__preview">
            <p className="hand-tool__legend-title">預覽（不用鏡頭）</p>
            <div className="hand-tool__preview-actions">
              {PREVIEW_GESTURES.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setGesture(id)
                    setElement(null)
                    setShapeLabelSafe(null)
                    syncCanvasSize()
                    const canvas = effectRef.current
                    if (canvas && targetsRef.current.length === 0) {
                      targetsRef.current = spawnTargets(canvas.width || 800, canvas.height || 450)
                    }
                    triggerEffect(id)
                    setStatus(
                      id === 'magic'
                        ? '預覽：魔法揮出（可打金色目標）'
                        : `預覽：${GESTURE_META[id].label}`,
                    )
                  }}
                >
                  {GESTURE_META[id].label}
                </button>
              ))}
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  syncCanvasSize()
                  const canvas = effectRef.current
                  if (!canvas) return
                  demoShapeRef.current = {
                    points: sampleDualLPoints(canvas.width || 800, canvas.height || 450),
                    until: performance.now() + 2800,
                    kind: 'l_quad',
                  }
                  setGesture('l_shape')
                  setShapeLabelSafe('雙手 L → 四邊形')
                  setStatus('預覽：合攏→分開後的四邊形')
                }}
              >
                開合四邊形
              </button>
              {(Object.keys(ELEMENT_META) as ElementId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setElement(id)
                    setShapeLabelSafe(null)
                    triggerElement(id)
                  }}
                >
                  {ELEMENT_META[id].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  )
}
