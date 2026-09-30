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
    const snapshot = partyStore.startQuestion(code, String(body.playerId))
    return NextResponse.json({ snapshot })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '開始失敗' },
      { status: 400 },
    )
  }
}
