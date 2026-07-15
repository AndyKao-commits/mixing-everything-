import type { Dir, Vec, ZoneId } from './types'

export const TILE = 64
export const COLS = 15
export const ROWS = 11
export const VIEW_COLS = 9
export const VIEW_ROWS = 11
export const WIDTH = VIEW_COLS * TILE
export const HEIGHT = VIEW_ROWS * TILE

type Biome = {
  grassA: string
  grassB: string
  block: string
  blockAccent: string
  path: string
  pathDeep: string
  mist: string
}

const BIOMES: Record<ZoneId, Biome> = {
  mistwood: {
    grassA: '#6f9a57',
    grassB: '#628c4d',
    block: '#234533',
    blockAccent: '#2f7a52',
    path: '#c4a57a',
    pathDeep: '#b59368',
    mist: '168, 120, 255',
  },
  ruins: {
    grassA: '#6d7364',
    grassB: '#5f6558',
    block: '#4b4f57',
    blockAccent: '#7a808c',
    path: '#b7a890',
    pathDeep: '#9f917a',
    mist: '140, 160, 210',
  },
  marsh: {
    grassA: '#4f6d4a',
    grassB: '#446140',
    block: '#2b4038',
    blockAccent: '#3f6a55',
    path: '#7d7058',
    pathDeep: '#6a5e49',
    mist: '90, 170, 140',
  },
}

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

function drawVoid(ctx: CanvasRenderingContext2D, px: number, py: number) {
  ctx.fillStyle = '#0a1210'
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = '#132019'
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)
}

function drawGrass(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  x: number,
  y: number,
  biome: Biome,
) {
  const tone = (x + y) % 2 === 0
  ctx.fillStyle = tone ? biome.grassA : biome.grassB
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = 'rgba(255,255,255,0.05)'
  for (let i = 0; i < 6; i += 1) {
    const n = hash(x + i, y + i * 3)
    ctx.fillRect(px + (n % (TILE - 10)) + 4, py + ((n >> 4) % (TILE - 10)) + 4, 2, 2)
  }
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  x: number,
  y: number,
  biome: Biome,
) {
  ctx.fillStyle = biome.path
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = biome.pathDeep
  ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6)
  const n = hash(x, y)
  ctx.fillStyle = '#8c7354'
  ctx.beginPath()
  ctx.arc(px + 16 + (n % 10), py + 20 + ((n >> 3) % 8), 4, 0, Math.PI * 2)
  ctx.arc(px + 42, py + 38, 3, 0, Math.PI * 2)
  ctx.fill()
}

function drawBlock(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  x: number,
  y: number,
  biome: Biome,
  zoneId: ZoneId,
) {
  ctx.fillStyle = biome.block
  ctx.fillRect(px, py, TILE, TILE)
  if (zoneId === 'ruins') {
    ctx.fillStyle = biome.blockAccent
    ctx.fillRect(px + 10, py + 14, 44, 34)
    ctx.fillStyle = '#2d3138'
    ctx.fillRect(px + 18, py + 22, 10, 18)
    ctx.fillRect(px + 36, py + 22, 10, 18)
  } else {
    ctx.fillStyle = '#6a4428'
    ctx.fillRect(px + 27, py + 34, 10, 22)
    const sway = ((hash(x, y) % 5) - 2) * 0.8
    ctx.fillStyle = biome.blockAccent
    ctx.beginPath()
    ctx.moveTo(px + 32 + sway, py + 6)
    ctx.lineTo(px + 56, py + 40)
    ctx.lineTo(px + 8, py + 40)
    ctx.closePath()
    ctx.fill()
  }
}

function drawMist(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  x: number,
  y: number,
  time: number,
  biome: Biome,
) {
  drawGrass(ctx, px, py, x, y, biome)
  const mid = TILE / 2
  const pulse = 0.28 + Math.sin(time / 320 + x * 0.7 + y) * 0.12
  const mist = ctx.createRadialGradient(px + mid, py + mid, 4, px + mid, py + mid, mid)
  mist.addColorStop(0, `rgba(${biome.mist}, ${pulse + 0.18})`)
  mist.addColorStop(1, `rgba(${biome.mist}, ${pulse * 0.18})`)
  ctx.fillStyle = mist
  ctx.fillRect(px, py, TILE, TILE)
}

function drawCamp(ctx: CanvasRenderingContext2D, px: number, py: number, time: number, biome: Biome) {
  drawPath(ctx, px, py, 0, 0, biome)
  const mid = TILE / 2
  ctx.fillStyle = '#5d4a36'
  ctx.fillRect(px + 18, py + 38, 28, 8)
  const flicker = 7 + Math.sin(time / 90) * 2 + Math.sin(time / 40) * 1
  const flame = ctx.createRadialGradient(px + mid, py + 28, 1, px + mid, py + 28, flicker + 10)
  flame.addColorStop(0, 'rgba(255, 230, 140, 0.95)')
  flame.addColorStop(0.45, 'rgba(228, 87, 46, 0.8)')
  flame.addColorStop(1, 'rgba(228, 87, 46, 0)')
  ctx.fillStyle = flame
  ctx.beginPath()
  ctx.arc(px + mid, py + 28, flicker + 10, 0, Math.PI * 2)
  ctx.fill()
}

function drawPortal(ctx: CanvasRenderingContext2D, px: number, py: number, time: number, biome: Biome) {
  drawPath(ctx, px, py, 1, 1, biome)
  const mid = TILE / 2
  const glow = 14 + Math.sin(time / 160) * 4
  const gate = ctx.createRadialGradient(px + mid, py + mid - 4, 2, px + mid, py + mid - 4, glow + 12)
  gate.addColorStop(0, 'rgba(180, 255, 220, 0.95)')
  gate.addColorStop(0.5, 'rgba(80, 180, 255, 0.55)')
  gate.addColorStop(1, 'rgba(80, 180, 255, 0)')
  ctx.fillStyle = gate
  ctx.beginPath()
  ctx.arc(px + mid, py + mid - 4, glow + 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(210, 255, 240, 0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(px + mid, py + mid - 4, 14, 0, Math.PI * 2)
  ctx.stroke()
}

function drawHeroAt(ctx: CanvasRenderingContext2D, px: number, py: number, facing: Dir, time: number) {
  const bob = Math.sin(time / 140) * 2
  const x = px + 12
  const y = py + 6 + bob
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.beginPath()
  ctx.ellipse(x + 20, y + 50, 16, 5, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1f6b52'
  drawRoundRect(ctx, x + 8, y + 24, 26, 24, 8)
  ctx.fill()
  ctx.fillStyle = '#163a33'
  drawRoundRect(ctx, x + 10, y + 22, 22, 22, 6)
  ctx.fill()
  ctx.fillStyle = '#f0d7a8'
  ctx.beginPath()
  ctx.arc(x + 21, y + 16, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e4572e'
  drawRoundRect(ctx, x + 10, y + 6, 22, 8, 4)
  ctx.fill()
  ctx.fillStyle = '#13241f'
  const eyeX = facing === 'left' ? x + 14 : facing === 'right' ? x + 24 : x + 18
  ctx.fillRect(eyeX, y + 15, 3, 3)
  if (facing === 'up' || facing === 'down') ctx.fillRect(x + 24, y + 15, 3, 3)
  if (facing === 'right' || facing === 'down') {
    ctx.fillStyle = '#d7dde4'
    ctx.fillRect(x + 32, y + 28, 14, 4)
    ctx.fillStyle = '#8a5a2b'
    ctx.fillRect(x + 30, y + 26, 4, 7)
  }
}

export function paintWorld(
  ctx: CanvasRenderingContext2D,
  map: number[][],
  pos: Vec,
  facing: Dir,
  time: number,
  zoneId: ZoneId = 'mistwood',
) {
  const biome = BIOMES[zoneId]
  const originX = pos.x - Math.floor(VIEW_COLS / 2)
  const originY = pos.y - Math.floor(VIEW_ROWS / 2)
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  for (let sy = 0; sy < VIEW_ROWS; sy += 1) {
    for (let sx = 0; sx < VIEW_COLS; sx += 1) {
      const wx = originX + sx
      const wy = originY + sy
      const px = sx * TILE
      const py = sy * TILE
      if (wy < 0 || wy >= ROWS || wx < 0 || wx >= COLS) {
        drawVoid(ctx, px, py)
        continue
      }
      const tile = map[wy]![wx]!
      if (tile === 1) drawBlock(ctx, px, py, wx, wy, biome, zoneId)
      else if (tile === 2) drawPath(ctx, px, py, wx, wy, biome)
      else if (tile === 3) drawMist(ctx, px, py, wx, wy, time, biome)
      else if (tile === 4) drawCamp(ctx, px, py, time, biome)
      else if (tile === 5) drawPortal(ctx, px, py, time, biome)
      else drawGrass(ctx, px, py, wx, wy, biome)
    }
  }

  const veil = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 40, WIDTH / 2, HEIGHT / 2, Math.max(WIDTH, HEIGHT) * 0.72)
  veil.addColorStop(0, 'rgba(20, 40, 30, 0)')
  veil.addColorStop(1, 'rgba(8, 16, 12, 0.42)')
  ctx.fillStyle = veil
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const heroSx = Math.floor(VIEW_COLS / 2)
  const heroSy = Math.floor(VIEW_ROWS / 2)
  drawHeroAt(ctx, heroSx * TILE, heroSy * TILE, facing, time)
}
