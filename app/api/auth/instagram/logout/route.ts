import { NextResponse } from 'next/server'
import { clearInstagramSession } from '@/server/instagramSession'

export const dynamic = 'force-dynamic'

export async function POST() {
  await clearInstagramSession()
  return NextResponse.json({ ok: true })
}

export async function GET(request: Request) {
  await clearInstagramSession()
  const url = new URL(request.url)
  return NextResponse.redirect(`${url.protocol}//${url.host}/settings?ig=logged_out`)
}
