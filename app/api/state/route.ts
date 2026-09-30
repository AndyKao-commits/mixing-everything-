import { NextResponse } from 'next/server'
import { gameStore } from '@/lib/game-store'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(gameStore.getPublicState())
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : '錯誤' }, { status: 400 })
  }
}
