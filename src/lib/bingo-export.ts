'use client'

export async function exportBingoImage(opts: {
  eventName: string
  playerName: string
  cells: Array<{ text: string; photo_data_url: string | null; completed: boolean }>
  completed: number
}): Promise<Blob> {
  const width = 1080
  const height = 1080
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1c1917'
  ctx.fillRect(0, 0, width, height)

  const gap = 8
  const size = (width - gap * 2) / 3
  const startY = 0

  for (let i = 0; i < 9; i += 1) {
    const col = i % 3
    const row = Math.floor(i / 3)
    const x = col * (size + gap)
    const y = startY + row * (size + gap)
    ctx.fillStyle = '#292524'
    ctx.fillRect(x, y, size, size)
    const cell = opts.cells[i]
    if (cell?.photo_data_url) {
      const img = await loadImage(cell.photo_data_url)
      drawImageCover(ctx, img, x, y, size, size)
    }
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

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sourceX = (img.naturalWidth - sourceWidth) / 2
  const sourceY = (img.naturalHeight - sourceHeight) / 2
  ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height)
}
