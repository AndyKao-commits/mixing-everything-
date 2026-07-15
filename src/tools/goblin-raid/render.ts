import type { Dir, Vec } from './types'

export const TILE = 48
export const COLS = 15
export const ROWS = 11
export const WIDTH = COLS * TILE
export const HEIGHT = ROWS * TILE

export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function hash(x: number, y: number) {
  return ((x * 73856093) ^ (y * 19349663)) >>> 0
}

function drawGrass(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
  const tone = (x + y) % 2 === 0
  ctx.fillStyle = tone ? '#6f9a57' : '#628c4d'
  ctx.fillRect(px, py, TILE, TILE)

  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  for (let i = 0; i < 5; i += 1) {
    const n = hash(x + i, y + i * 3)
    ctx.fillRect(px + (n % 40) + 4, py + ((n >> 4) % 40) + 4, 2, 2)
  }

  ctx.strokeStyle = 'rgba(45, 78, 40, 0.35)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(px + 10, py + 30)
  ctx.quadraticCurveTo(px + 12, py + 18, px + 8, py + 12)
  ctx.moveTo(px + 28, py + 34)
  ctx.quadraticCurveTo(px + 30, py + 22, px + 34, py + 16)
  ctx.stroke()
}

function drawPath(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
  ctx.fillStyle = '#c4a57a'
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = '#b59368'
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)

  const n = hash(x, y)
  ctx.fillStyle = '#9f7d55'
  ctx.beginPath()
  ctx.arc(px + 12 + (n % 8), py + 16 + ((n >> 3) % 6), 3, 0, Math.PI * 2)
  ctx.arc(px + 30, py + 28, 2.5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.fillRect(px + 6, py + 8, 10, 3)
}

function drawTree(ctx: CanvasRenderingContext2D, px: number, py: number, x: number, y: number) {
  ctx.fillStyle = '#234533'
  ctx.fillRect(px, py, TILE, TILE)

  // undergrowth
  ctx.fillStyle = '#1a3427'
  ctx.fillRect(px, py + TILE - 10, TILE, 10)

  // trunk
  ctx.fillStyle = '#6a4428'
  ctx.fillRect(px + 20, py + 26, 8, 16)
  ctx.fillStyle = '#825533'
  ctx.fillRect(px + 21, py + 26, 3, 16)

  const sway = ((hash(x, y) % 5) - 2) * 0.6
  ctx.fillStyle = '#1f5a3c'
  ctx.beginPath()
  ctx.moveTo(px + 24 + sway, py + 4)
  ctx.lineTo(px + 42, py + 30)
  ctx.lineTo(px + 6, py + 30)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#2f7a52'
  ctx.beginPath()
  ctx.moveTo(px + 24 + sway, py + 10)
  ctx.lineTo(px + 38, py + 28)
  ctx.lineTo(px + 10, py + 28)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = 'rgba(180, 230, 170, 0.25)'
  ctx.beginPath()
  ctx.arc(px + 18, py + 18, 4, 0, Math.PI * 2)
  ctx.fill()
}

function drawMist(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  x: number,
  y: number,
  time: number,
) {
  drawGrass(ctx, px, py, x, y)
  const pulse = 0.28 + Math.sin(time / 320 + x * 0.7 + y) * 0.12
  const mist = ctx.createRadialGradient(px + 24, py + 24, 4, px + 24, py + 24, 28)
  mist.addColorStop(0, `rgba(168, 120, 255, ${pulse + 0.15})`)
  mist.addColorStop(1, `rgba(80, 40, 140, ${pulse * 0.35})`)
  ctx.fillStyle = mist
  ctx.fillRect(px, py, TILE, TILE)

  ctx.fillStyle = `rgba(230, 210, 255, ${0.25 + pulse})`
  for (let i = 0; i < 3; i += 1) {
    const ox = ((time / 40 + i * 17 + x * 9) % TILE)
    const oy = 12 + ((i * 11 + y * 5) % 20)
    ctx.beginPath()
    ctx.ellipse(px + ox, py + oy, 10, 4, 0, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawCamp(ctx: CanvasRenderingContext2D, px: number, py: number, time: number) {
  drawPath(ctx, px, py, 0, 0)
  ctx.fillStyle = '#5d4a36'
  ctx.fillRect(px + 14, py + 28, 20, 6)
  ctx.fillRect(px + 12, py + 32, 24, 4)

  const flicker = 5 + Math.sin(time / 90) * 2 + Math.sin(time / 40) * 1
  const flame = ctx.createRadialGradient(px + 24, py + 22, 1, px + 24, py + 22, flicker + 8)
  flame.addColorStop(0, 'rgba(255, 230, 140, 0.95)')
  flame.addColorStop(0.45, 'rgba(228, 87, 46, 0.8)')
  flame.addColorStop(1, 'rgba(228, 87, 46, 0)')
  ctx.fillStyle = flame
  ctx.beginPath()
  ctx.arc(px + 24, py + 22, flicker + 8, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffcf6d'
  ctx.beginPath()
  ctx.moveTo(px + 24, py + 12)
  ctx.lineTo(px + 30, py + 26)
  ctx.lineTo(px + 18, py + 26)
  ctx.closePath()
  ctx.fill()
}

function drawHero(
  ctx: CanvasRenderingContext2D,
  pos: Vec,
  facing: Dir,
  time: number,
) {
  const bob = Math.sin(time / 140) * 2
  const px = pos.x * TILE + 8
  const py = pos.y * TILE + 4 + bob

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(px + 16, py + 40, 12, 4, 0, 0, Math.PI * 2)
  ctx.fill()

  // cape
  ctx.fillStyle = '#1f6b52'
  drawRoundRect(ctx, px + 6, py + 18, 20, 18, 6)
  ctx.fill()

  // body
  ctx.fillStyle = '#163a33'
  drawRoundRect(ctx, px + 8, py + 16, 16, 16, 5)
  ctx.fill()

  // head
  ctx.fillStyle = '#f0d7a8'
  ctx.beginPath()
  ctx.arc(px + 16, py + 12, 9, 0, Math.PI * 2)
  ctx.fill()

  // bandana
  ctx.fillStyle = '#e4572e'
  drawRoundRect(ctx, px + 8, py + 5, 16, 6, 3)
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(px + 24, py + 7)
  ctx.lineTo(px + 30, py + 4)
  ctx.lineTo(px + 28, py + 11)
  ctx.closePath()
  ctx.fill()

  // eyes
  ctx.fillStyle = '#13241f'
  const eyeX = facing === 'left' ? px + 11 : facing === 'right' ? px + 18 : px + 14
  ctx.fillRect(eyeX, py + 11, 2.5, 2.5)
  if (facing === 'up' || facing === 'down') {
    ctx.fillRect(px + 18, py + 11, 2.5, 2.5)
  }

  // blade
  if (facing === 'right' || facing === 'down') {
    ctx.fillStyle = '#d7dde4'
    ctx.fillRect(px + 24, py + 20, 10, 3)
    ctx.fillStyle = '#8a5a2b'
    ctx.fillRect(px + 22, py + 19, 3, 5)
  }
}

export function paintWorld(
  ctx: CanvasRenderingContext2D,
  map: number[][],
  pos: Vec,
  facing: Dir,
  time: number,
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const tile = map[y]![x]!
      const px = x * TILE
      const py = y * TILE
      if (tile === 1) drawTree(ctx, px, py, x, y)
      else if (tile === 2) drawPath(ctx, px, py, x, y)
      else if (tile === 3) drawMist(ctx, px, py, x, y, time)
      else if (tile === 4) drawCamp(ctx, px, py, time)
      else drawGrass(ctx, px, py, x, y)
    }
  }

  // soft dusk veil
  const veil = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 60, WIDTH / 2, HEIGHT / 2, 420)
  veil.addColorStop(0, 'rgba(20, 40, 30, 0)')
  veil.addColorStop(1, 'rgba(8, 16, 12, 0.45)')
  ctx.fillStyle = veil
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  drawHero(ctx, pos, facing, time)
}
