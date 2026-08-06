'use client'

import { useEffect, useRef, useState } from 'react'
import { WindowFrame } from '@/components/WindowFrame'
import {
  GESTURE_META,
  HAND_CONNECTIONS,
  classifyGesture,
  type GestureId,
  type Landmark,
} from './gestures'

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

type FlashState = {
  until: number
  color: string
}

type GlowState = {
  until: number
  intensity: number
}

const HOLD_MS = 280
const COOLDOWN_MS = 900

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
) {
  const pt = (i: number) => {
    const lm = landmarks[i]
    const x = mirrored ? (1 - lm.x) * w : lm.x * w
    const y = lm.y * h
    return { x, y }
  }

  ctx.lineWidth = 3
  ctx.strokeStyle = 'rgba(26, 26, 26, 0.85)'
  ctx.fillStyle = '#e4572e'

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
  const lastVideoTimeRef = useRef(-1)

  const holdGestureRef = useRef<GestureId>('none')
  const holdSinceRef = useRef(0)
  const lastFiredRef = useRef<{ id: GestureId; at: number }>({ id: 'none', at: 0 })
  const landmarksRef = useRef<Landmark[] | null>(null)

  const [running, setRunning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gesture, setGesture] = useState<GestureId>('none')
  const [shake, setShake] = useState(false)
  const [status, setStatus] = useState('尚未啟動鏡頭')

  const triggerEffect = (id: GestureId) => {
    const canvas = effectRef.current
    if (!canvas) return
    const w = canvas.width
    const h = canvas.height
    const now = performance.now()

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
      const lm = landmarksRef.current
      if (lm) {
        laserRef.current = {
          x: (1 - lm[8].x) * w,
          y: lm[8].y * h,
          until: now + 700,
        }
      } else {
        laserRef.current = { x: w * 0.5, y: h * 0.35, until: now + 700 }
      }
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
    if (next === 'none') return
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
    const video = videoRef.current
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
    if (video && video.videoWidth) {
      // keep object-fit cover alignment for drawing
    }
  }

  const stopCamera = () => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    landmarkerRef.current?.close()
    landmarkerRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setRunning(false)
    setStatus('已停止')
    setGesture('none')
    landmarksRef.current = null
    const overlay = overlayRef.current
    if (overlay) {
      const ctx = overlay.getContext('2d')
      ctx?.clearRect(0, 0, overlay.width, overlay.height)
    }
  }

  const startCamera = async () => {
    setError(null)
    setLoading(true)
    setStatus('載入手部模型中…')
    try {
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
        numHands: 1,
      })
      landmarkerRef.current = landmarker

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      const video = videoRef.current
      if (!video) throw new Error('找不到 video 元素')
      video.srcObject = stream
      await video.play()

      setRunning(true)
      setStatus('追蹤中 — 比個手勢試試')
      setLoading(false)

      const loop = () => {
        rafRef.current = requestAnimationFrame(loop)
        syncCanvasSize()
        paintEffects()

        const lm = landmarkerRef.current
        const overlay = overlayRef.current
        if (!lm || !video || !overlay) return
        if (video.readyState < 2) return

        const now = performance.now()
        if (video.currentTime === lastVideoTimeRef.current) {
          // still redraw skeleton from last landmarks
          const ctx = overlay.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, overlay.width, overlay.height)
            if (landmarksRef.current) {
              drawSkeleton(ctx, landmarksRef.current, overlay.width, overlay.height, true)
            }
          }
          return
        }
        lastVideoTimeRef.current = video.currentTime

        const result = lm.detectForVideo(video, now)
        const ctx = overlay.getContext('2d')
        if (!ctx) return
        ctx.clearRect(0, 0, overlay.width, overlay.height)

        const hand = result.landmarks?.[0]
        if (hand && hand.length >= 21) {
          landmarksRef.current = hand as Landmark[]
          drawSkeleton(ctx, landmarksRef.current, overlay.width, overlay.height, true)
          considerGesture(classifyGesture(landmarksRef.current))
        } else {
          landmarksRef.current = null
          considerGesture('none')
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (err) {
      console.error(err)
      setLoading(false)
      setRunning(false)
      const message =
        err instanceof Error ? err.message : '無法啟動鏡頭或載入模型'
      if (/NotAllowedError|Permission/i.test(String(err))) {
        setError('需要允許攝影機權限才能追蹤手部。')
      } else {
        setError(message)
      }
      setStatus('啟動失敗')
      stopCamera()
    }
  }

  useEffect(() => {
    // Keep effects animating when camera loop is not painting (preview buttons).
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
  const previewGestures: GestureId[] = ['thumbs_up', 'ok', 'open_palm', 'peace', 'fist', 'point']

  return (
    <div className="tool-page">
      <WindowFrame
        title="手勢特效.exe"
        footer={status}
        toolbar={<span className="win__menu">Camera · Gestures · Effects</span>}
      >
        <div className="hand-tool">
          <p className="hand-tool__intro">
            用鏡頭抓手部骨架，辨識手勢後觸發不同特效。個人實驗用，資料都在本機。
          </p>

          <div className="hand-tool__actions">
            {!running ? (
              <button
                type="button"
                className="btn btn--primary"
                disabled={loading}
                onClick={() => void startCamera()}
              >
                {loading ? '載入中…' : '開啟鏡頭'}
              </button>
            ) : (
              <button type="button" className="btn btn--ghost" onClick={stopCamera}>
                關閉鏡頭
              </button>
            )}
          </div>

          {error ? <p className="hand-tool__error">{error}</p> : null}

          <div
            ref={stageRef}
            className={`hand-tool__stage${shake ? ' is-shake' : ''}${running ? ' is-live' : ''}`}
          >
            <video ref={videoRef} className="hand-tool__video" playsInline muted />
            <canvas ref={overlayRef} className="hand-tool__overlay" />
            <canvas ref={effectRef} className="hand-tool__effects" />
            {!running ? (
              <div className="hand-tool__placeholder">
                <p>開啟鏡頭後，把手放進畫面</p>
                <p className="muted">也可先用下方按鈕預覽特效</p>
              </div>
            ) : null}
            <div className="hand-tool__badge" aria-live="polite">
              <strong>{meta.label}</strong>
              <span>{meta.effect}</span>
            </div>
          </div>

          <div className="hand-tool__legend">
            <p className="hand-tool__legend-title">手勢對應</p>
            <ul>
              {previewGestures.map((id) => (
                <li key={id}>
                  <span>{GESTURE_META[id].label}</span>
                  <span className="muted">→ {GESTURE_META[id].effect}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hand-tool__preview">
            <p className="hand-tool__legend-title">預覽特效（不用鏡頭）</p>
            <div className="hand-tool__preview-actions">
              {previewGestures.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setGesture(id)
                    triggerEffect(id)
                    setStatus(`預覽：${GESTURE_META[id].label} → ${GESTURE_META[id].effect}`)
                  }}
                >
                  {GESTURE_META[id].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </WindowFrame>
    </div>
  )
}
