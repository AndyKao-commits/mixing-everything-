import { createHmac, timingSafeEqual } from 'crypto'
import { cookies } from 'next/headers'
import { serverConfig } from '@/server/config'

export const IG_COOKIE = 'mixing_ig_session'

export type InstagramSession = {
  accessToken: string
  userId: string
  username?: string
  expiresAt: number
}

function sign(value: string) {
  const { authSecret } = serverConfig()
  return createHmac('sha256', authSecret).update(value).digest('base64url')
}

export function encodeSession(session: InstagramSession) {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url')
  return `${payload}.${sign(payload)}`
}

export function decodeSession(raw: string | undefined | null): InstagramSession | null {
  if (!raw) return null
  const [payload, signature] = raw.split('.')
  if (!payload || !signature) return null
  const expected = sign(payload)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as InstagramSession
    if (!session.accessToken || !session.userId || !session.expiresAt) return null
    if (Date.now() > session.expiresAt) return null
    return session
  } catch {
    return null
  }
}

export async function readInstagramSession() {
  const jar = await cookies()
  return decodeSession(jar.get(IG_COOKIE)?.value)
}

export async function writeInstagramSession(session: InstagramSession) {
  const jar = await cookies()
  jar.set(IG_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.max(60, Math.floor((session.expiresAt - Date.now()) / 1000)),
  })
}

export async function clearInstagramSession() {
  const jar = await cookies()
  jar.delete(IG_COOKIE)
}
