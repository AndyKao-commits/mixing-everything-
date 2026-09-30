import { NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const token = req.headers.get('x-player-token') || ''
    return NextResponse.json(gameStore.completeSecret(token))
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '錯誤' }, { status: 400 })
  }
}
