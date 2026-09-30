import { NextResponse } from 'next/server'
import { partyStore } from '@/lib/party-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const body = await req.json()
    const playerId = String(body.playerId || '')
    if (!playerId) {
      return NextResponse.json({ error: '缺少玩家' }, { status: 400 })
    }
    const result = partyStore.heartbeat(code, playerId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '心跳失敗' },
      { status: 400 },
    )
  }
}
