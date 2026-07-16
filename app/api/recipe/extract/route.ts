import { NextResponse } from 'next/server'
import { extractRecipeFromRequest } from '@/server/recipePipeline'
import { readInstagramSession } from '@/server/instagramSession'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || ''
    let url = ''
    let caption = ''
    let upload: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      url = String(form.get('url') || '')
      caption = String(form.get('caption') || '')
      const file = form.get('file')
      upload = file instanceof File && file.size > 0 ? file : null
    } else {
      const body = (await request.json()) as { url?: string; caption?: string }
      url = body.url || ''
      caption = body.caption || ''
    }

    if (!url.trim() && !caption.trim() && !upload) {
      return NextResponse.json(
        { error: '請提供影片連結、說明文字，或上傳影片檔。' },
        { status: 400 },
      )
    }

    const session = await readInstagramSession()
    const result = await extractRecipeFromRequest({
      url,
      caption,
      upload,
      session,
    })

    return NextResponse.json({ ok: true, result })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '掃描失敗',
      },
      { status: 500 },
    )
  }
}
