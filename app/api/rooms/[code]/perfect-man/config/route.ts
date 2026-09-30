import { NextResponse } from 'next/server'
import { partyStore } from '@/lib/party-store'
import type { PerfectManMode, QuestionCategory } from '@/types/game'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const body = await req.json()
    const snapshot = partyStore.configurePerfectMan(
      code,
      String(body.playerId),
      body.mode as PerfectManMode,
      (body.categories || []) as QuestionCategory[],
    )
    return NextResponse.json({ snapshot })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '設定失敗' },
      { status: 400 },
    )
  }
}
