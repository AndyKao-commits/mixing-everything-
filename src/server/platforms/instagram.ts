import { serverConfig } from '@/server/config'
import type { InstagramSession } from '@/server/instagramSession'
import type { VideoSourceMaterial } from '@/server/platforms/fetchSource'

function shortcodeFromUrl(url: string) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const idx = parts.findIndex((part) => part === 'reel' || part === 'p' || part === 'tv')
    if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
    return null
  } catch {
    return null
  }
}

export async function fetchInstagramWithSession(
  url: string,
  session: InstagramSession,
): Promise<VideoSourceMaterial> {
  const warnings: string[] = []
  const rawNotes: string[] = []
  const shortcode = shortcodeFromUrl(url)

  try {
    const mediaRes = await fetch(
      `https://graph.instagram.com/v21.0/me/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username&limit=50&access_token=${encodeURIComponent(session.accessToken)}`,
      { next: { revalidate: 0 } },
    )
    if (!mediaRes.ok) {
      warnings.push(`Instagram Graph 讀取失敗（HTTP ${mediaRes.status}）`)
      return { platform: 'Instagram', warnings, rawNotes }
    }
    const payload = (await mediaRes.json()) as {
      data?: Array<{
        id: string
        caption?: string
        media_type?: string
        media_url?: string
        permalink?: string
        thumbnail_url?: string
        username?: string
      }>
    }

    const match = (payload.data || []).find((item) => {
      if (!item.permalink) return false
      if (item.permalink.replace(/\/$/, '') === url.replace(/\/$/, '')) return true
      if (shortcode && item.permalink.includes(shortcode)) return true
      return false
    })

    if (!match) {
      warnings.push('登入帳號的近期媒體中找不到此連結（官方 API 只能讀自己帳號內容）')
      return { platform: 'Instagram', warnings, rawNotes }
    }

    rawNotes.push('已用 Instagram 登入權杖讀取媒體')
    return {
      platform: 'Instagram',
      title: match.caption?.split('\n')[0]?.slice(0, 40),
      caption: match.caption,
      mediaUrl: match.media_url,
      thumbnailUrl: match.thumbnail_url,
      author: match.username || session.username,
      warnings,
      rawNotes,
    }
  } catch {
    warnings.push('Instagram Graph 請求失敗')
    return { platform: 'Instagram', warnings, rawNotes }
  }
}

export async function fetchInstagramViaMediaApi(url: string): Promise<VideoSourceMaterial> {
  const cfg = serverConfig()
  const warnings: string[] = []
  const rawNotes: string[] = []
  if (!cfg.instagramMediaApiUrl) {
    return { platform: 'Instagram', warnings: ['未設定 INSTAGRAM_MEDIA_API_URL'], rawNotes }
  }

  try {
    const endpoint = new URL(cfg.instagramMediaApiUrl)
    endpoint.searchParams.set('url', url)
    const headers: Record<string, string> = { Accept: 'application/json' }
    if (cfg.instagramMediaApiKey) headers['x-api-key'] = cfg.instagramMediaApiKey
    if (cfg.instagramMediaApiHost) headers['x-rapidapi-host'] = cfg.instagramMediaApiHost
    if (cfg.instagramMediaApiKey && cfg.instagramMediaApiHost) {
      headers['x-rapidapi-key'] = cfg.instagramMediaApiKey
    }

    const res = await fetch(endpoint.toString(), { headers, next: { revalidate: 0 } })
    if (!res.ok) {
      warnings.push(`第三方 Instagram API 失敗（HTTP ${res.status}）`)
      return { platform: 'Instagram', warnings, rawNotes }
    }
    const data = (await res.json()) as Record<string, unknown>
    const caption =
      (typeof data.caption === 'string' && data.caption) ||
      (typeof data.description === 'string' && data.description) ||
      (typeof data.title === 'string' && data.title) ||
      undefined
    const mediaUrl =
      (typeof data.video_url === 'string' && data.video_url) ||
      (typeof data.media_url === 'string' && data.media_url) ||
      (typeof data.download_url === 'string' && data.download_url) ||
      undefined
    const title = typeof data.title === 'string' ? data.title : caption?.split('\n')[0]
    rawNotes.push('已透過第三方 Instagram Media API 取得內容')
    return {
      platform: 'Instagram',
      title,
      caption,
      mediaUrl,
      thumbnailUrl: typeof data.thumbnail === 'string' ? data.thumbnail : undefined,
      author: typeof data.username === 'string' ? data.username : undefined,
      warnings,
      rawNotes,
    }
  } catch {
    warnings.push('第三方 Instagram API 請求失敗')
    return { platform: 'Instagram', warnings, rawNotes }
  }
}

export function instagramAuthorizeUrl(state: string) {
  const cfg = serverConfig()
  const url = new URL('https://www.instagram.com/oauth/authorize')
  url.searchParams.set('client_id', cfg.instagramAppId)
  url.searchParams.set('redirect_uri', cfg.instagramRedirectUri)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('scope', 'instagram_business_basic')
  url.searchParams.set('state', state)
  return url.toString()
}

export async function exchangeInstagramCode(code: string) {
  const cfg = serverConfig()
  const body = new URLSearchParams({
    client_id: cfg.instagramAppId,
    client_secret: cfg.instagramAppSecret,
    grant_type: 'authorization_code',
    redirect_uri: cfg.instagramRedirectUri,
    code,
  })
  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Instagram token exchange failed: ${text}`)
  }
  const short = (await res.json()) as { access_token: string; user_id: number | string }

  // Exchange for long-lived token
  const longUrl = new URL('https://graph.instagram.com/access_token')
  longUrl.searchParams.set('grant_type', 'ig_exchange_token')
  longUrl.searchParams.set('client_secret', cfg.instagramAppSecret)
  longUrl.searchParams.set('access_token', short.access_token)
  const longRes = await fetch(longUrl.toString())
  let accessToken = short.access_token
  let expiresIn = 60 * 60 * 24 * 30
  if (longRes.ok) {
    const long = (await longRes.json()) as { access_token: string; expires_in: number }
    accessToken = long.access_token
    expiresIn = long.expires_in
  }

  let username: string | undefined
  try {
    const me = await fetch(
      `https://graph.instagram.com/v21.0/me?fields=user_id,username&access_token=${encodeURIComponent(accessToken)}`,
    )
    if (me.ok) {
      const data = (await me.json()) as { username?: string; user_id?: string }
      username = data.username
    }
  } catch {
    // optional
  }

  return {
    accessToken,
    userId: String(short.user_id),
    username,
    expiresAt: Date.now() + expiresIn * 1000,
  }
}
