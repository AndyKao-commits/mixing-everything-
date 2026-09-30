import { getCache } from '@vercel/functions'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'

const STATE_KEY = 'bbq-party-state-v1'
const PHOTO_PREFIX = 'bbq-party-photo:'
const TTL_SECONDS = 60 * 60 * 24 * 14

function localFile() {
  return join(process.cwd(), '.data', 'bbq-store.json')
}

function runtimeCache() {
  if (!process.env.VERCEL) return null
  try {
    return getCache({ namespace: 'bbq-party' })
  } catch {
    return null
  }
}

export async function persistGet<T = unknown>(key: string): Promise<T | null> {
  const cache = runtimeCache()
  if (cache) {
    try {
      const value = await cache.get(key)
      return (value as T) ?? null
    } catch (error) {
      console.error('persistGet cache error', key, error)
    }
  }

  if (key === STATE_KEY) {
    try {
      const file = localFile()
      if (!existsSync(file)) return null
      return JSON.parse(readFileSync(file, 'utf8')) as T
    } catch {
      return null
    }
  }

  return null
}

export async function persistSet(key: string, value: unknown): Promise<void> {
  const cache = runtimeCache()
  if (cache) {
    try {
      await cache.set(key, value, { ttl: TTL_SECONDS, tags: ['bbq-party'] })
      return
    } catch (error) {
      console.error('persistSet cache error', key, error)
    }
  }

  if (key === STATE_KEY) {
    const file = localFile()
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, JSON.stringify(value))
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
