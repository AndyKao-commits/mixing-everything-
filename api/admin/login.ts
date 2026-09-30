import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Explicit login route so /api/admin/login does not depend solely on the catch-all.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: '請使用 POST' })
      return
    }

    const { routeApiRequest } = await import('../../src/lib/http-router')
    const result = await routeApiRequest({
      method: 'POST',
      path: 'admin/login',
      headers: {
        get(name: string) {
          const value = req.headers[name.toLowerCase()]
          if (Array.isArray(value)) return value[0] || null
          return value ?? null
        },
      },
      body: req.body,
    })
    res.status(result.status).json(result.data)
  } catch (error) {
    const message = error instanceof Error ? error.message : '伺服器錯誤'
    console.error('admin login handler error', error)
    res.status(500).json({ error: message })
  }
}
