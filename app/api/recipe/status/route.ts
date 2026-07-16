import { NextResponse } from 'next/server'
import { capabilities } from '@/server/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    capabilities: {
      ...capabilities(),
      publicVideoFetch: true,
      othersRecipes: true,
    },
  })
}
