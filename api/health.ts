import type { VercelRequest, VercelResponse } from '@vercel/node'

/** Zero-dependency probe to distinguish platform routing vs app crashes. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    vercel: Boolean(process.env.VERCEL),
    time: new Date().toISOString(),
  })
}
