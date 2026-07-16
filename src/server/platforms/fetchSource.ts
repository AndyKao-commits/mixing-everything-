import { YoutubeTranscript } from 'youtube-transcript'
import { detectPlatform } from '@/lib/recipeParse'

export type VideoSourceMaterial = {
  platform: string
  title?: string
  caption?: string
  transcript?: string
  author?: string
  mediaUrl?: string
  thumbnailUrl?: string
  warnings: string[]
  rawNotes: string[]
}

function extractYoutubeId(url: string) {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '') || null
    if (u.searchParams.get('v')) return u.searchParams.get('v')
    const short = u.pathname.match(/\/(?:shorts|embed|live)\/([^/?#]+)/)
    return short?.[1] || null
  } catch {
    return null
  }
}

export async function fetchYoutubeMaterial(url: string): Promise<VideoSourceMaterial> {
  const warnings: string[] = []
  const rawNotes: string[] = []
  const id = extractYoutubeId(url)
  let title: string | undefined
  let author: string | undefined
  let thumbnailUrl: string | undefined
  let transcript: string | undefined

  try {
    const oembed = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { next: { revalidate: 0 } },
    )
    if (oembed.ok) {
      const data = (await oembed.json()) as { title?: string; author_name?: string; thumbnail_url?: string }
      title = data.title
      author = data.author_name
      thumbnailUrl = data.thumbnail_url
    }
  } catch {
    warnings.push('無法取得 YouTube oEmbed 資訊')
  }

  if (id) {
    try {
      const parts = await YoutubeTranscript.fetchTranscript(id, { lang: 'zh-Hant' }).catch(async () =>
        YoutubeTranscript.fetchTranscript(id),
      )
      transcript = parts.map((part) => part.text).join('\n')
      rawNotes.push('已擷取 YouTube 字幕／逐字稿')
    } catch {
      warnings.push('此影片沒有可用字幕，或字幕被關閉')
    }
  }

  return {
    platform: 'YouTube',
    title,
    author,
    thumbnailUrl,
    transcript,
    warnings,
    rawNotes,
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\n/g, '\n')
    .replace(/\\u0026/g, '&')
}

function pickMeta(html: string, keys: string[]) {
  for (const key of keys) {
    const patterns = [
      new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`, 'i'),
    ]
    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) return decodeHtml(match[1])
    }
  }
  return undefined
}

export async function fetchPublicPageMaterial(url: string): Promise<VideoSourceMaterial> {
  const platform = detectPlatform(url)
  const warnings: string[] = []
  const rawNotes: string[] = []

  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; MixingEverything/1.0; +https://github.com/AndyKao-commits/mixing-everything-)',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    })
    if (!res.ok) {
      warnings.push(`公開頁面讀取失敗（HTTP ${res.status}）`)
      return { platform, warnings, rawNotes }
    }
    const html = await res.text()
    const title = pickMeta(html, ['og:title', 'twitter:title']) || pickMeta(html, ['title'])
    const caption =
      pickMeta(html, ['og:description', 'twitter:description', 'description']) ||
      undefined
    const thumbnailUrl = pickMeta(html, ['og:image', 'twitter:image'])
    if (caption) rawNotes.push('已從公開頁面 meta 取得說明文字')
    else warnings.push('公開頁面沒有可用說明（平台可能要求登入）')
    return {
      platform,
      title,
      caption,
      thumbnailUrl,
      warnings,
      rawNotes,
    }
  } catch {
    warnings.push('公開頁面抓取失敗（可能被平台擋下）')
    return { platform, warnings, rawNotes }
  }
}
