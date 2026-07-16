import { NextResponse } from 'next/server'
import { capabilities } from '@/server/config'
import { readInstagramSession } from '@/server/instagramSession'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await readInstagramSession()
  return NextResponse.json({
    capabilities: capabilities(),
    instagram: session
      ? {
          connected: true,
          username: session.username || null,
          userId: session.userId,
          expiresAt: session.expiresAt,
        }
      : { connected: false },
  })
}
