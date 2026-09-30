import { NextResponse } from 'next/server'
import { routeApiRequest } from '@/lib/http-router'

export const dynamic = 'force-dynamic'

async function handle(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  const method = req.method.toUpperCase()
  let body: any = {}
  if (method !== 'GET' && method !== 'HEAD') {
    body = await req.json().catch(() => ({}))
  }

  const result = await routeApiRequest({
    method,
    path: (path || []).join('/'),
    headers: req.headers,
    body,
  })

  return NextResponse.json(result.data, { status: result.status })
}

export const GET = handle
export const POST = handle
