'use client'

import { useEffect, useRef, useState } from 'react'
import { WindowFrame } from '@/components/WindowFrame'
import {
  GESTURE_META,
  HAND_CONNECTIONS,
  classifyGesture,
  orderPolygon,
  shapeBetweenHands,
  toScreenPoint,
  type GestureId,
  type Landmark,
  type Point2,
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
  kind: 'firework' | 'spark' | 'ripple'
}

type FlashState = { until: number; color: string }
type GlowState = { until: number; intensity: number }

const HOLD_MS = 280
const COOLDOWN_MS = 900
const PREVIEW_GESTURES: GestureId[] = [
  'thumbs_up',
  'ok',
  'open_palm',
  'peace',
  'fist',
  'point',
  'l_shape',
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

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  w: number,
  h: number,
  mirrored: boolean,
  color = '#e4572e',
) {
  const pt = (i: number) => toScreenPoint(landmarks[i], w, h, mirrored)

  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.85)'
  ctx.fillStyle = color

  for (const [a, b] of HAND_CONNECTIONS) {
    const p1 = pt(a)
    const p2 = pt(b)
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  for (let i = 0; i < landmarks.length; i++) {
    const p = pt(i)
    ctx.beginPath()
    ctx.arc(p.x, p.y, i === 0 ? 6 : 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawShapePolygon(
  ctx: CanvasRenderingContext2D,
  points: Point2[],
  kind: 'l_quad' | 'hull',
) {
  if (points.length < 3) return
  const ordered = orderPolygon(points)
  ctx.beginPath()
  ctx.moveTo(ordered[0].x, ordered[0].y)
  for (let i = 1; i < ordered.length; i++) {
    ctx.lineTo(ordered[i].x, ordered[i].y)
  }
  ctx.closePath()

  if (kind === 'l_quad') {
    ctx.fillStyle = 'rgba(228, 87, 46, 0.28)'
    ctx.strokeStyle = 'rgba(228, 87, 46, 0.95)'
    ctx.lineWidth = 4
  } else {
    ctx.fillStyle = 'rgba(79, 195, 247, 0.18)'
    ctx.strokeStyle = 'rgba(26, 26, 26, 0.65)'
    ctx.lineWidth = 3
    ctx.setLineDash([8, 6])
  }
  ctx.fill()
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = kind === 'l_quad' ? '#e4572e' : '#1a1a1a'
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
  const demoShapeRef = useRef<{ points: Point2[]; until: number } | null>(null)
  const lastVideoTimeRef = useRef(-1)
  const facingRef = useRef<FacingMode>('user')
  const mirroredRef = useRef(true)

  const holdGestureRef = useRef<GestureId>('none')
  const holdSinceRef = useRef(0)
  const lastFiredRef = useRef<{ id: GestureId; at: number }>({ id: 'none', at: 0 })
  const handsRef = useRef<Landmark[][]>([])
  const shapeLabelRef = useRef<string | null>(null)

  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gesture, setGesture] = useState<GestureId>('none')
  const [shapeLabel, setShapeLabel] = useState<string | null>(null)
  const [facing, setFacing] = useState<FacingMode>('user')
  const [shake, setShake] = useState(false)
  const [status, setStatus] = useState('尚未啟動鏡頭')

  const triggerEffect = (id: GestureId) => {
    const canvas = effectRef.current
    if (!canvas) return
    const w = canvas.width
    const h = canvas.height
    const now = performance.now()
    const mirrored = mirroredRef.current

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
      const lm = handsRef.current[0]
      if (lm) {
        const p = toScreenPoint(lm[8], w, h, mirrored)
        laserRef.current = { x: p.x, y: p.y, until: now + 700 }
      } else {
        laserRef.current = { x: w * 0.5, y: h * 0.35, until: now + 700 }
      }
    } else if (id === 'l_shape') {
      flashRef.current = { until: now + 260, color: 'rgba(228, 87, 46, 0.28)' }
    }
  }

  const considerGesture = (next: GestureId) => {
    const now = performance.now()
    if (next !== holdGestureRef.current) {
      holdGestureRef.current = next
      holdSinceRef.current = now
      setGesture(next)
      return
    }
    setGesture(next)
    if (next === 'none' || next === 'l_shape') return
    if (now - holdSinceRef.current < HOLD_MS) return
    const last = lastFiredRef.current
    if (last.id === next && now - last.at < COOLDOWN_MS) return
    lastFiredRef.current = { id: next, at: now }
    triggerEffect(next)
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
      drawShapePolygon(ctx, demo.points, 'l_quad')
    } else if (demo) {
      demoShapeRef.current = null
    }

    const next: Particle[] = []
    for (const p of particlesRef.current) {
      if (p.kind === 'ripple') {
        const radius = (1 - p.life) * Math.min(w, h) * 0.55
        ctx.beginPath()
        ctx.arc(p.x, p.y, Math.max(radius, 4), 0, Math.PI * 2)
        ctx.strokeStyle = p.color.replace(/[\d.]+\)$/, `${0.55 * p.life})`)
        ctx.lineWidth = 6 * p.life
        ctx.stroke()
        p.life -= 0.03
      } else {
        p.x += p.vx
        p.y += p.vy
        if (p.kind === 'firework') p.vy += 0.08
        p.life -= p.kind === 'spark' ? 0.018 : 0.016
        ctx.globalAlpha = Math.max(p.life, 0)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
      }
      if (p.life > 0) next.push(p)
    }
    particlesRef.current = next
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

  const paintOverlay = (hands: Landmark[][], mirrored: boolean) => {
    const overlay = overlayRef.current
    if (!overlay) return
    const ctx = overlay.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, overlay.width, overlay.height)

    const colors = ['#e4572e', '#2a9d8f']
    hands.forEach((hand, i) => {
      drawSkeleton(ctx, hand, overlay.width, overlay.height, mirrored, colors[i % colors.length])
    })

    const shape = shapeBetweenHands(hands)
    if (shape) {
      const screenPts = shape.points.map((p) =>
        toScreenPoint(p, overlay.width, overlay.height, mirrored),
      )
      drawShapePolygon(ctx, screenPts, shape.kind)
      if (shapeLabelRef.current !== shape.label) {
        shapeLabelRef.current = shape.label
        setShapeLabel(shape.label)
      }
    } else if (shapeLabelRef.current) {
      shapeLabelRef.current = null
      setShapeLabel(null)
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
    setShapeLabel(null)
    shapeLabelRef.current = null
    handsRef.current = []
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
      // Some desktops reject facingMode ideal — retry plain video.
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
      const mirrored = mirroredRef.current
      if (!lm || !video) return
      if (video.readyState < 2) return

      const now = performance.now()
      if (video.currentTime === lastVideoTimeRef.current) {
        paintOverlay(handsRef.current, mirrored)
        return
      }
      lastVideoTimeRef.current = video.currentTime

      const result = lm.detectForVideo(video, now)
      const hands = (result.landmarks ?? []).filter((h) => h.length >= 21) as Landmark[][]
      handsRef.current = hands
      paintOverlay(hands, mirrored)

      if (hands.length === 0) {
        considerGesture('none')
        return
      }

      const shape = shapeBetweenHands(hands)
      if (shape?.kind === 'l_quad') {
        setGesture('l_shape')
        holdGestureRef.current = 'l_shape'
        setStatus('雙手 L：四個頂角連成四邊形')
        return
      }

      // Prefer a non-none gesture from either hand for single-hand effects.
      const ids = hands.map((h) => classifyGesture(h))
      const primary =
        ids.find((id) => id !== 'none' && id !== 'l_shape') ?? ids.find((id) => id !== 'none') ?? 'none'
      considerGesture(primary)
      if (hands.length > 1 && shape) {
        setStatus(`${GESTURE_META[primary].label} · ${shape.label}`)
      } else if (primary !== 'none') {
        setStatus(`追蹤中 — ${GESTURE_META[primary].label}`)
      } else {
        setStatus('追蹤中 — 比個手勢試試')
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
      setStatus('追蹤中 — 單手特效，雙手比 L 可畫四邊形')
      setLoading(false)
      lastVideoTimeRef.current = -1
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
      setStatus(next === 'user' ? '前置鏡頭' : '後置鏡頭')
    } catch (err) {
      console.error(err)
      setError(
        next === 'environment'
          ? '這台裝置可能沒有後置鏡頭，或瀏覽器不支援切換。'
          : '無法切換回前置鏡頭。',
      )
      // Try to restore previous camera.
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
  const badgeTitle = shapeLabel ?? meta.label
  const badgeSub = shapeLabel ? '四個頂角連線' : meta.effect

  return (
    <div className="tool-page tool-page--camera">
      <WindowFrame
        title="手勢特效.exe"
        footer={status}
        toolbar={<span className="win__menu">Camera · Gestures · Shapes</span>}
      >
        <div className="hand-tool">
          <p className="hand-tool__intro">
            鏡頭追蹤單／雙手骨架。單手觸發特效；兩手都比 L 時，四個頂角會連成不規則四邊形。
          </p>

          <div className="hand-tool__actions">
            {!running ? (
              <button
                type="button"
                className="btn btn--primary"
                disabled={loading}
                onClick={() => void startCamera('user')}
              >
                {loading ? '載入中…' : '開啟鏡頭'}
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
                    : facing === 'user'
                      ? '切換後置鏡頭'
                      : '切換前置鏡頭'}
                </button>
              </>
            )}
            <span className="hand-tool__facing muted">
              目前：{facing === 'user' ? '前置' : '後置'}
              {facing === 'user' ? '（鏡像）' : ''}
            </span>
          </div>

          {error ? <p className="hand-tool__error">{error}</p> : null}

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
                <p>開啟鏡頭後，把手放進畫面</p>
                <p className="muted">雙手比 L 可看到四邊形 · 也可先預覽特效</p>
              </div>
            ) : null}
            <div className="hand-tool__badge" aria-live="polite">
              <strong>{badgeTitle}</strong>
              <span>{badgeSub}</span>
            </div>
          </div>

          <div className="hand-tool__legend">
            <p className="hand-tool__legend-title">手勢對應</p>
            <ul>
              {PREVIEW_GESTURES.map((id) => (
                <li key={id}>
                  <span>{GESTURE_META[id].label}</span>
                  <span className="muted">→ {GESTURE_META[id].effect}</span>
                </li>
              ))}
              <li>
                <span>雙手都比 L</span>
                <span className="muted">→ 四個頂角連成四邊形</span>
              </li>
            </ul>
          </div>

          <div className="hand-tool__preview">
            <p className="hand-tool__legend-title">預覽（不用鏡頭）</p>
            <div className="hand-tool__preview-actions">
              {PREVIEW_GESTURES.filter((id) => id !== 'l_shape').map((id) => (
                <button
                  key={id}
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setGesture(id)
                    setShapeLabel(null)
                    triggerEffect(id)
                    setStatus(`預覽：${GESTURE_META[id].label} → ${GESTURE_META[id].effect}`)
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
                  const points = sampleDualLPoints(canvas.width || 800, canvas.height || 450)
                  demoShapeRef.current = { points, until: performance.now() + 2800 }
                  setGesture('l_shape')
                  setShapeLabel('雙手 L → 四邊形')
                  setStatus('預覽：雙手 L → 不規則四邊形')
                }}
              >
                雙手 L 四邊形
              </button>
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  )
}
