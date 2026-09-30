import { NextResponse } from 'next/server'
import { partyStore } from '@/lib/party-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params
    const snapshot = partyStore.getSnapshot(code)
    return NextResponse.json({ snapshot })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '讀取失敗' },
      { status: 404 },
    )
  }
}
