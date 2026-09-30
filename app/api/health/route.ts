import { NextResponse } from 'next/server'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, persistence: 'not_configured' }, { status: 503 })
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('app_state')
      .select('version,updated_at')
      .eq('key', 'bbq-party-state-v2')
      .maybeSingle()
    if (error) throw error
    return NextResponse.json({
      ok: true,
      persistence: 'supabase',
      stateExists: Boolean(data),
      stateVersion: data?.version ?? 0,
      stateUpdatedAt: data?.updated_at ?? null,
    })
  } catch {
    return NextResponse.json({ ok: false, persistence: 'supabase', database: 'unreachable' }, { status: 503 })
  }
}
