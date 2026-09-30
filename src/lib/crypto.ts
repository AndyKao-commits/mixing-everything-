import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'crypto'

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
