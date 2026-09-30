import { NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const token = req.headers.get('x-player-token') || ''
    gameStore.finalizeDonationDefaults()
    return NextResponse.json(gameStore.getPlayerView(token))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '錯誤' }, { status: 401 })
  }
}
