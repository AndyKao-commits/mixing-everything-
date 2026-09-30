import { NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const token = req.headers.get('x-player-token') || ''
    const body = await req.json()
    const view = gameStore.completeBingoCell(token, String(body.cellId), String(body.photoDataUrl || ''))
    return NextResponse.json(view)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '錯誤' }, { status: 400 })
  }
}
