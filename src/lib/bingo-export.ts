'use client'

export async function exportBingoImage(opts: {
  eventName: string
  playerName: string
  cells: Array<{ text: string; photo_data_url: string | null; completed: boolean }>
  completed: number
}): Promise<Blob> {
  const width = 1080
  const height = 1350
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1c1917'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#fffaf5'
  ctx.font = 'bold 54px sans-serif'
  ctx.fillText(opts.eventName, 60, 90)
  ctx.font = '40px sans-serif'
  ctx.fillText(opts.playerName, 60, 150)
  ctx.fillText(`完成 ${opts.completed}/9 · ${new Date().toLocaleDateString('zh-TW')}`, 60, 200)

  const gap = 18
  const size = (width - 60 * 2 - gap * 2) / 3
  const startY = 240

  for (let i = 0; i < 9; i += 1) {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = 60 + col * (size + gap)
    const y = startY + row * (size + gap + 48)
    ctx.fillStyle = '#292524'
    ctx.fillRect(x, y, size, size)
    const cell = opts.cells[i]
    if (cell?.photo_data_url) {
      const img = await loadImage(cell.photo_data_url)
      ctx.drawImage(img, x, y, size, size)
    }
    ctx.fillStyle = '#fffaf5'
    ctx.font = '22px sans-serif'
    wrapText(ctx, cell?.text || '', x + 8, y + size + 28, size - 16, 26)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('匯出失敗'))), 'image/png')
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const chars = text.split('')
  let line = ''
  let yy = y
  for (const ch of chars) {
    const test = line + ch
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, yy)
      line = ch
      yy += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, yy)
}
