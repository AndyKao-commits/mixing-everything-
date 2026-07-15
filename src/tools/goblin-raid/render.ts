import type { Dir, Vec, ZoneId } from './types'

export const TILE = 72
export const COLS = 15
export const ROWS = 11
export const VIEW_COLS = 7
export const VIEW_ROWS = 9
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
  const base = ctx.createLinearGradient(px, py, px, py + TILE)
  base.addColorStop(0, tone ? biome.grassA : biome.grassB)
  base.addColorStop(1, tone ? biome.grassB : biome.grassA)
  ctx.fillStyle = base
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = 'rgba(255,255,255,0.07)'
  for (let i = 0; i < 8; i += 1) {
    const n = hash(x + i, y + i * 3)
    const bladeX = px + (n % (TILE - 12)) + 4
    const bladeY = py + ((n >> 4) % (TILE - 14)) + 6
    ctx.fillRect(bladeX, bladeY, 2, 5)
  }
  ctx.fillStyle = 'rgba(20,40,24,0.08)'
  ctx.fillRect(px, py + TILE - 8, TILE, 8)
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  x: number,
  y: number,
  biome: Biome,
) {
  const dirt = ctx.createLinearGradient(px, py, px + TILE, py + TILE)
  dirt.addColorStop(0, biome.path)
  dirt.addColorStop(1, biome.pathDeep)
  ctx.fillStyle = dirt
  ctx.fillRect(px, py, TILE, TILE)
  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.fillRect(px + 4, py + 4, TILE - 8, 3)
  const n = hash(x, y)
  ctx.fillStyle = 'rgba(90, 70, 45, 0.45)'
  ctx.beginPath()
  ctx.arc(px + 16 + (n % 10), py + 20 + ((n >> 3) % 8), 5, 0, Math.PI * 2)
  ctx.arc(px + 44, py + 40, 3.5, 0, Math.PI * 2)
  ctx.arc(px + 28, py + 52, 2.5, 0, Math.PI * 2)
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
  const shade = ctx.createLinearGradient(px, py, px + TILE, py + TILE)
  shade.addColorStop(0, biome.block)
  shade.addColorStop(1, '#0d1612')
  ctx.fillStyle = shade
  ctx.fillRect(px, py, TILE, TILE)
  if (zoneId === 'ruins') {
    ctx.fillStyle = biome.blockAccent
    drawRoundRect(ctx, px + 9, py + 12, 46, 38, 4)
    ctx.fill()
    ctx.fillStyle = 'rgba(20,24,30,0.85)'
    ctx.fillRect(px + 17, py + 22, 11, 20)
    ctx.fillRect(px + 36, py + 22, 11, 20)
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(px + 11, py + 14, 42, 3)
  } else {
    ctx.fillStyle = '#5a3a22'
    drawRoundRect(ctx, px + 28, py + 36, 12, 24, 3)
    ctx.fill()
    const sway = ((hash(x, y) % 5) - 2) * 0.9
    const canopy = ctx.createRadialGradient(px + 32 + sway, py + 24, 4, px + 32 + sway, py + 28, 28)
    canopy.addColorStop(0, biome.blockAccent)
    canopy.addColorStop(1, '#152820')
    ctx.fillStyle = canopy
    ctx.beginPath()
    ctx.ellipse(px + 32 + sway, py + 28, 26, 22, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(180, 230, 170, 0.12)'
    ctx.beginPath()
    ctx.ellipse(px + 24 + sway, py + 20, 10, 8, 0, 0, Math.PI * 2)
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
  const bob = Math.sin(time / 150) * 2.2
  const stride = Math.sin(time / 120) * 1.6
  const x = px + 10
  const y = py + 4 + bob
  const mid = x + 26

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.32)'
  ctx.beginPath()
  ctx.ellipse(mid, y + 58, 18, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  // Cloak
  const cloak = ctx.createLinearGradient(mid - 18, y + 18, mid + 18, y + 56)
  cloak.addColorStop(0, '#245a48')
  cloak.addColorStop(0.55, '#163a33')
  cloak.addColorStop(1, '#0d241f')
  ctx.fillStyle = cloak
  ctx.beginPath()
  ctx.moveTo(mid - 4, y + 20)
  ctx.quadraticCurveTo(mid - 24, y + 34, mid - 20, y + 54 + stride)
  ctx.lineTo(mid + 20, y + 54 - stride)
  ctx.quadraticCurveTo(mid + 24, y + 34, mid + 4, y + 20)
  ctx.closePath()
  ctx.fill()

  // Legs / boots
  ctx.fillStyle = '#2a2218'
  drawRoundRect(ctx, mid - 12, y + 46, 8, 12, 2)
  ctx.fill()
  drawRoundRect(ctx, mid + 4, y + 46, 8, 12, 2)
  ctx.fill()
  ctx.fillStyle = '#8a5a2b'
  drawRoundRect(ctx, mid - 13, y + 54, 10, 5, 2)
  ctx.fill()
  drawRoundRect(ctx, mid + 3, y + 54, 10, 5, 2)
  ctx.fill()

  // Torso armor
  const armor = ctx.createLinearGradient(mid - 12, y + 22, mid + 12, y + 48)
  armor.addColorStop(0, '#3f8f6e')
  armor.addColorStop(1, '#1f5a46')
  ctx.fillStyle = armor
  drawRoundRect(ctx, mid - 12, y + 24, 24, 24, 7)
  ctx.fill()
  ctx.fillStyle = '#d7c28a'
  ctx.fillRect(mid - 2, y + 26, 4, 18)
  ctx.fillStyle = '#e4572e'
  drawRoundRect(ctx, mid - 10, y + 28, 20, 5, 2)
  ctx.fill()

  // Head
  ctx.fillStyle = '#f2d4a8'
  ctx.beginPath()
  ctx.arc(mid, y + 16, 11, 0, Math.PI * 2)
  ctx.fill()

  // Helm band + plume
  ctx.fillStyle = '#c9d2da'
  drawRoundRect(ctx, mid - 12, y + 7, 24, 8, 3)
  ctx.fill()
  ctx.fillStyle = '#e4572e'
  ctx.beginPath()
  ctx.moveTo(mid - 2, y + 2)
  ctx.quadraticCurveTo(mid + 2, y - 8, mid + 10, y - 2)
  ctx.quadraticCurveTo(mid + 2, y + 2, mid - 2, y + 8)
  ctx.closePath()
  ctx.fill()

  // Eyes by facing
  ctx.fillStyle = '#13241f'
  if (facing === 'left') {
    ctx.fillRect(mid - 8, y + 15, 3, 3)
  } else if (facing === 'right') {
    ctx.fillRect(mid + 5, y + 15, 3, 3)
  } else if (facing === 'up') {
    ctx.fillRect(mid - 5, y + 13, 3, 2)
    ctx.fillRect(mid + 2, y + 13, 3, 2)
  } else {
    ctx.fillRect(mid - 5, y + 16, 3, 3)
    ctx.fillRect(mid + 2, y + 16, 3, 3)
  }

  // Blade (side views)
  if (facing === 'left') {
    ctx.fillStyle = '#8a5a2b'
    drawRoundRect(ctx, mid - 26, y + 28, 5, 8, 1)
    ctx.fill()
    const blade = ctx.createLinearGradient(mid - 40, y + 30, mid - 22, y + 34)
    blade.addColorStop(0, '#f4f7fb')
    blade.addColorStop(1, '#9aa7b5')
    ctx.fillStyle = blade
    drawRoundRect(ctx, mid - 40, y + 30, 16, 4, 1)
    ctx.fill()
  } else {
    ctx.fillStyle = '#8a5a2b'
    drawRoundRect(ctx, mid + 10, y + 28, 5, 8, 1)
    ctx.fill()
    const blade = ctx.createLinearGradient(mid + 14, y + 30, mid + 34, y + 34)
    blade.addColorStop(0, '#9aa7b5')
    blade.addColorStop(1, '#f4f7fb')
    ctx.fillStyle = blade
    drawRoundRect(ctx, mid + 14, y + 30, 18, 4, 1)
    ctx.fill()
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
