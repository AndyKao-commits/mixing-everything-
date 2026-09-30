import type { VercelRequest, VercelResponse } from '@vercel/node'
import { routeApiRequest } from '../src/lib/http-router'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const parts = req.query.path
  const path = Array.isArray(parts) ? parts.join('/') : String(parts || '')

  const headers = {
    get(name: string) {
      const value = req.headers[name.toLowerCase()]
      if (Array.isArray(value)) return value[0] || null
      return value ?? null
    },
  }

  const result = await routeApiRequest({
    method: req.method || 'GET',
    path,
    headers,
    body: req.body,
  })

  res.status(result.status).json(result.data)
}
