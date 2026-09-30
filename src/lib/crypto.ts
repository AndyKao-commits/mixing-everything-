import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

export function uid(): string {
  return randomBytes(16).toString('hex')
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function hashPin(pin: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || randomBytes(16).toString('hex')
  const hash = scryptSync(pin, useSalt, 32).toString('hex')
  return { hash, salt: useSalt }
}

export function verifyPin(pin: string, hash: string, salt: string): boolean {
  try {
    const next = scryptSync(pin, salt, 32)
    const prev = Buffer.from(hash, 'hex')
    if (next.length !== prev.length) return false
    return timingSafeEqual(next, prev)
  } catch {
    return false
  }
}

export function sessionToken(): string {
  return createHash('sha256').update(randomBytes(32)).digest('hex')
}

function authSecret() {
  const secret = process.env.SESSION_SECRET
  if (secret) return secret
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production')
  }
  return process.env.ADMIN_PIN || 'bbq-party-local-dev-secret'
}

function sign(payload: string): string {
  return createHmac('sha256', authSecret()).update(payload).digest('hex')
}

function safeEqualHex(a: string, b: string): boolean {
  try {
    const left = Buffer.from(a, 'hex')
    const right = Buffer.from(b, 'hex')
    if (left.length !== right.length) return false
    return timingSafeEqual(left, right)
  } catch {
    return false
  }
}

/** Stateless admin token that survives serverless cold starts. */
export function signAdminToken(ttlMs = 1000 * 60 * 60 * 12): string {
  const exp = Date.now() + ttlMs
  const nonce = randomBytes(8).toString('hex')
  const payload = `a:${exp}:${nonce}`
  return `${payload}:${sign(payload)}`
}

export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token) return false
  const parts = token.split(':')
  if (parts.length !== 4 || parts[0] !== 'a') return false
  const [, expRaw, nonce, sig] = parts
  if (!/^\d+$/.test(expRaw) || !nonce || !sig) return false
  if (Number(expRaw) < Date.now()) return false
  const payload = `a:${expRaw}:${nonce}`
  return safeEqualHex(sig, sign(payload))
}

/** Stateless player token encoding playerId + expiry. */
export function signPlayerToken(playerId: string, eventId: string, ttlMs = 1000 * 60 * 60 * 24 * 7): string {
  const exp = Date.now() + ttlMs
  const payload = `p:${eventId}:${playerId}:${exp}`
  return `${payload}:${sign(payload)}`
}

export function verifyPlayerToken(
  token: string | null | undefined,
): { eventId: string; playerId: string; expiresAt: number } | null {
  if (!token) return null
  const parts = token.split(':')
  if (parts.length !== 5 || parts[0] !== 'p') return null
  const [, eventId, playerId, expRaw, sig] = parts
  if (!eventId || !playerId || !/^\d+$/.test(expRaw) || !sig) return null
  const expiresAt = Number(expRaw)
  if (expiresAt < Date.now()) return null
  const payload = `p:${eventId}:${playerId}:${expRaw}`
  if (!safeEqualHex(sig, sign(payload))) return null
  return { eventId, playerId, expiresAt }
}
