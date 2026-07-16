import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { capabilities } from '@/server/config'
import { instagramAuthorizeUrl } from '@/server/platforms/instagram'

export const dynamic = 'force-dynamic'

export async function GET() {
  const caps = capabilities()
  if (!caps.instagramOAuth) {
    return NextResponse.json(
      {
        error:
          '尚未設定 INSTAGRAM_APP_ID / INSTAGRAM_APP_SECRET。請先在 Meta 建立 App 並填入環境變數。',
      },
      { status: 400 },
    )
  }

  const state = randomBytes(16).toString('hex')
  const url = instagramAuthorizeUrl(state)
  const res = NextResponse.redirect(url)
  res.cookies.set('mixing_ig_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 600,
  })
  return res
}
