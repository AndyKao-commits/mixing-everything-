import { NextResponse } from 'next/server'
import { partyStore } from '@/lib/party-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const nickname = String(body.nickname || '').trim()
    const playerId = body.playerId ? String(body.playerId) : undefined
    if (!nickname) {
      return NextResponse.json({ error: '請輸入代號' }, { status: 400 })
    }
    const snapshot = partyStore.createRoom(nickname, playerId)
    return NextResponse.json({ snapshot })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '建立失敗' },
      { status: 400 },
    )
  }
}
