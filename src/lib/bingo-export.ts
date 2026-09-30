'use client'

export async function exportBingoImage(opts: {
  eventName: string
  playerName: string
  cells: Array<{ text: string; photo_data_url: string | null; completed: boolean }>
  completed: number
}): Promise<Blob> {
  const width = 1080
  const height = 1254
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1c1917'
  ctx.fillRect(0, 0, width, height)

  const gap = 8
  const labelHeight = 58
  const size = (width - gap * 2) / 3
  const startY = 0

  for (let i = 0; i < 9; i += 1) {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = col * (size + gap)
    const y = startY + row * (size + labelHeight + gap)
    ctx.fillStyle = '#292524'
    ctx.fillRect(x, y, size, size)
    const cell = opts.cells[i]
    if (cell?.photo_data_url) {
      const img = await loadImage(cell.photo_data_url)
      ctx.drawImage(img, x, y, size, size)
    }
    ctx.fillStyle = '#fffaf5'
    drawSingleLine(ctx, cell?.text || '', x + 8, y + size + 34, size - 16)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('匯出失敗'))), 'image/png')
  })
}

async function loadImage(src: string) {
  // Supabase signed URLs are cross-origin. Drawing a cross-origin image directly
  // taints the canvas and makes canvas.toBlob() fail. Fetch the image first and
  // render it through a same-origin blob URL instead.
  if (/^https?:\/\//i.test(src)) {
    const response = await fetch(src, { mode: 'cors', credentials: 'omit' })
    if (!response.ok) throw new Error('照片載入失敗')
    const objectUrl = URL.createObjectURL(await response.blob())
    try {
      return await loadImageElement(objectUrl)
    } finally {
      URL.revokeObjectURL(objectUrl)
    }
  }
  return loadImageElement(src)
}

function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('照片載入失敗'))
    img.src = src
  })
}

function drawSingleLine(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  let fontSize = 22
  ctx.font = fontSize + 'px sans-serif'
  while (fontSize > 14 && ctx.measureText(text).width > maxWidth) {
    fontSize -= 1
    ctx.font = fontSize + 'px sans-serif'
  }
  let output = text
  while (output.length > 1 && ctx.measureText(output).width > maxWidth) output = output.slice(0, -1)
  if (output !== text) output += '…'
  ctx.fillText(output, x, y)
}
