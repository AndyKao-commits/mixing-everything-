import type { Dir, Vec, ZoneId } from './types'

export const TILE = 48
export const COLS = 15
export const ROWS = 11
export const WIDTH = COLS * TILE
export const HEIGHT = ROWS * TILE

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
  for (let i = 0; i < 5; i += 1) {
    const n = hash(x + i, y + i * 3)
    ctx.fillRect(px + (n % 40) + 4, py + ((n >> 4) % 40) + 4, 2, 2)
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
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4)
  const n = hash(x, y)
  ctx.fillStyle = '#8c7354'
  ctx.beginPath()
  ctx.arc(px + 12 + (n % 8), py + 16 + ((n >> 3) % 6), 3, 0, Math.PI * 2)
  ctx.arc(px + 30, py + 28, 2.5, 0, Math.PI * 2)
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
    ctx.fillRect(px + 8, py + 10, 32, 26)
    ctx.fillStyle = '#2d3138'
    ctx.fillRect(px + 14, py + 16, 8, 14)
    ctx.fillRect(px + 26, py + 16, 8, 14)
  } else {
    ctx.fillStyle = '#6a4428'
    ctx.fillRect(px + 20, py + 26, 8, 16)
    const sway = ((hash(x, y) % 5) - 2) * 0.6
    ctx.fillStyle = biome.blockAccent
    ctx.beginPath()
    ctx.moveTo(px + 24 + sway, py + 4)
    ctx.lineTo(px + 42, py + 30)
    ctx.lineTo(px + 6, py + 30)
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
  const pulse = 0.28 + Math.sin(time / 320 + x * 0.7 + y) * 0.12
  const mist = ctx.createRadialGradient(px + 24, py + 24, 4, px + 24, py + 24, 28)
  mist.addColorStop(0, `rgba(${biome.mist}, ${pulse + 0.15})`)
  mist.addColorStop(1, `rgba(${biome.mist}, ${pulse * 0.2})`)
  ctx.fillStyle = mist
  ctx.fillRect(px, py, TILE, TILE)
}

function drawCamp(ctx: CanvasRenderingContext2D, px: number, py: number, time: number, biome: Biome) {
  drawPath(ctx, px, py, 0, 0, biome)
  ctx.fillStyle = '#5d4a36'
  ctx.fillRect(px + 14, py + 28, 20, 6)
  const flicker = 5 + Math.sin(time / 90) * 2 + Math.sin(time / 40) * 1
  const flame = ctx.createRadialGradient(px + 24, py + 22, 1, px + 24, py + 22, flicker + 8)
  flame.addColorStop(0, 'rgba(255, 230, 140, 0.95)')
  flame.addColorStop(0.45, 'rgba(228, 87, 46, 0.8)')
  flame.addColorStop(1, 'rgba(228, 87, 46, 0)')
  ctx.fillStyle = flame
  ctx.beginPath()
  ctx.arc(px + 24, py + 22, flicker + 8, 0, Math.PI * 2)
  ctx.fill()
}

function drawPortal(ctx: CanvasRenderingContext2D, px: number, py: number, time: number, biome: Biome) {
  drawPath(ctx, px, py, 1, 1, biome)
  const glow = 10 + Math.sin(time / 160) * 3
  const gate = ctx.createRadialGradient(px + 24, py + 22, 2, px + 24, py + 22, glow + 10)
  gate.addColorStop(0, 'rgba(180, 255, 220, 0.95)')
  gate.addColorStop(0.5, 'rgba(80, 180, 255, 0.55)')
  gate.addColorStop(1, 'rgba(80, 180, 255, 0)')
  ctx.fillStyle = gate
  ctx.beginPath()
  ctx.arc(px + 24, py + 22, glow + 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(210, 255, 240, 0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(px + 24, py + 22, 11, 0, Math.PI * 2)
  ctx.stroke()
}

function drawHero(ctx: CanvasRenderingContext2D, pos: Vec, facing: Dir, time: number) {
  const bob = Math.sin(time / 140) * 2
  const px = pos.x * TILE + 8
  const py = pos.y * TILE + 4 + bob
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(px + 16, py + 40, 12, 4, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1f6b52'
  drawRoundRect(ctx, px + 6, py + 18, 20, 18, 6)
  ctx.fill()
  ctx.fillStyle = '#163a33'
  drawRoundRect(ctx, px + 8, py + 16, 16, 16, 5)
  ctx.fill()
  ctx.fillStyle = '#f0d7a8'
  ctx.beginPath()
  ctx.arc(px + 16, py + 12, 9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e4572e'
  drawRoundRect(ctx, px + 8, py + 5, 16, 6, 3)
  ctx.fill()
  ctx.fillStyle = '#13241f'
  const eyeX = facing === 'left' ? px + 11 : facing === 'right' ? px + 18 : px + 14
  ctx.fillRect(eyeX, py + 11, 2.5, 2.5)
  if (facing === 'up' || facing === 'down') ctx.fillRect(px + 18, py + 11, 2.5, 2.5)
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
  zoneId: ZoneId = 'mistwood',
) {
  const biome = BIOMES[zoneId]
  ctx.clearRect(0, 0, WIDTH, HEIGHT)

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const tile = map[y]![x]!
      const px = x * TILE
      const py = y * TILE
      if (tile === 1) drawBlock(ctx, px, py, x, y, biome, zoneId)
      else if (tile === 2) drawPath(ctx, px, py, x, y, biome)
      else if (tile === 3) drawMist(ctx, px, py, x, y, time, biome)
      else if (tile === 4) drawCamp(ctx, px, py, time, biome)
      else if (tile === 5) drawPortal(ctx, px, py, time, biome)
      else drawGrass(ctx, px, py, x, y, biome)
    }
  }

  const veil = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 60, WIDTH / 2, HEIGHT / 2, 420)
  veil.addColorStop(0, 'rgba(20, 40, 30, 0)')
  veil.addColorStop(1, 'rgba(8, 16, 12, 0.45)')
  ctx.fillStyle = veil
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  drawHero(ctx, pos, facing, time)
}
