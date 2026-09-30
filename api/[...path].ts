import type { VercelRequest, VercelResponse } from '@vercel/node'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Lazy-load app code so import failures become JSON errors, not platform HTML 500s.
    const { routeApiRequest } = await import('../src/lib/http-router')

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
  } catch (error) {
    const message = error instanceof Error ? error.message : '伺服器錯誤'
    console.error('api handler error', error)
    res.status(500).json({ error: message })
  }
}
