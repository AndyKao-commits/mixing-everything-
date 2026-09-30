/**
 * Cross-instance state for Vercel serverless.
 * Prefer Vercel Runtime Cache; never crash the request if persistence is unavailable.
 */

const STATE_KEY = 'bbq-party-state-v1'
const PHOTO_PREFIX = 'bbq-party-photo:'
const TTL_SECONDS = 60 * 60 * 24 * 14

type CacheLike = {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown, opts?: { ttl?: number; tags?: string[] }): Promise<void>
}

// Process-local fallback (dev + warm lambdas)
const memory = new Map<string, unknown>()

async function runtimeCache(): Promise<CacheLike | null> {
  if (!process.env.VERCEL) return null
  try {
    const mod = await import('@vercel/functions')
    return mod.getCache({ namespace: 'bbq-party' }) as CacheLike
  } catch (error) {
    console.error('runtimeCache unavailable', error)
    return null
  }
}

function readLocalFile(key: string): unknown | null {
  if (process.env.VERCEL) return null
  if (key !== STATE_KEY) return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const file = path.join(process.cwd(), '.data', 'bbq-store.json')
    if (!fs.existsSync(file)) return null
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function writeLocalFile(key: string, value: unknown): void {
  if (process.env.VERCEL) return
  if (key !== STATE_KEY) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs')
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path')
    const file = path.join(process.cwd(), '.data', 'bbq-store.json')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(value))
  } catch (error) {
    console.error('writeLocalFile failed', error)
  }
}

export async function persistGet<T = unknown>(key: string): Promise<T | null> {
  try {
    const cache = await runtimeCache()
    if (cache) {
      const value = await cache.get(key)
      if (value != null) return value as T
    }
  } catch (error) {
    console.error('persistGet cache error', key, error)
  }

  if (memory.has(key)) return memory.get(key) as T

  const fromFile = readLocalFile(key)
  if (fromFile != null) return fromFile as T

  return null
}

export async function persistSet(key: string, value: unknown): Promise<void> {
  memory.set(key, value)
  writeLocalFile(key, value)

  try {
    const cache = await runtimeCache()
    if (cache) {
      await cache.set(key, value, { ttl: TTL_SECONDS, tags: ['bbq-party'] })
    }
  } catch (error) {
    console.error('persistSet cache error', key, error)
  }
}

export async function persistGetState<T = unknown>(): Promise<T | null> {
  return persistGet<T>(STATE_KEY)
}

export async function persistSetState(value: unknown): Promise<void> {
  await persistSet(STATE_KEY, value)
}

export async function persistGetPhoto(cellId: string): Promise<string | null> {
  const value = await persistGet<string>(PHOTO_PREFIX + cellId)
  return typeof value === 'string' ? value : null
}

export async function persistSetPhoto(cellId: string, dataUrl: string): Promise<void> {
  await persistSet(PHOTO_PREFIX + cellId, dataUrl)
}
