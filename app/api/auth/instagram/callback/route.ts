import { NextResponse } from 'next/server'
import { exchangeInstagramCode } from '@/server/platforms/instagram'
import { encodeSession, IG_COOKIE } from '@/server/instagramSession'
import { serverConfig } from '@/server/config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const err = url.searchParams.get('error_description') || url.searchParams.get('error')
  const origin = `${url.protocol}//${url.host}`

  if (err) {
    return NextResponse.redirect(`${origin}/settings?ig=error&message=${encodeURIComponent(err)}`)
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/settings?ig=error&message=${encodeURIComponent('缺少授權碼')}`)
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const expected = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('mixing_ig_oauth_state='))
    ?.split('=')[1]
  if (expected && state && expected !== state) {
    return NextResponse.redirect(`${origin}/settings?ig=error&message=${encodeURIComponent('OAuth state 不符')}`)
  }

  try {
    const session = await exchangeInstagramCode(code)
    const cfg = serverConfig()
    const res = NextResponse.redirect(`${origin}/settings?ig=connected`)
    res.cookies.set(IG_COOKIE, encodeSession(session), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000)),
    })
    res.cookies.delete('mixing_ig_oauth_state')
    void cfg
    return res
  } catch (error) {
    const message = error instanceof Error ? error.message : '登入失敗'
    return NextResponse.redirect(`${origin}/settings?ig=error&message=${encodeURIComponent(message)}`)
  }
}
