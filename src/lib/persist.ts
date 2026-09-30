/**
 * Cross-instance state for Vercel serverless.
 * Uses in-memory + optional Runtime Cache. Never throws.
 */

const STATE_KEY = 'bbq-party-state-v1'
const PHOTO_PREFIX = 'bbq-party-photo:'
const TTL_SECONDS = 60 * 60 * 24 * 14

type CacheLike = {
  get(key: string): Promise<unknown>
  set(key: string, value: unknown, opts?: { ttl?: number; tags?: string[] }): Promise<void>
}

const memory = new Map<string, unknown>()
let cacheInit: Promise<CacheLike | null> | null = null

function getRuntimeCache(): Promise<CacheLike | null> {
  if (!process.env.VERCEL) return Promise.resolve(null)
  if (!cacheInit) {
    cacheInit = (async () => {
      try {
        // Use require so @vercel/node CJS bundling can include it.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const mod = require('@vercel/functions') as {
          getCache: (opts?: { namespace?: string }) => CacheLike
        }
        return mod.getCache({ namespace: 'bbq-party' })
      } catch (error) {
        console.error('runtimeCache unavailable', error)
        return null
      }
    })()
  }
  return cacheInit
}

function readLocalFile(key: string): unknown | null {
  if (process.env.VERCEL || key !== STATE_KEY) return null
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
  if (process.env.VERCEL || key !== STATE_KEY) return
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
    const cache = await getRuntimeCache()
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
    const cache = await getRuntimeCache()
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
