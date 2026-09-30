/**
 * Temporary compatibility persistence layer.
 *
 * Production: Supabase Storage is used for bingo photos.
 * Legacy game-state persistence remains local-memory/file only until the
 * game-store migration is completed. We intentionally no longer use Vercel
 * Runtime Cache as a database.
 */
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase-admin'

const STATE_KEY = 'bbq-party-state-v1'
const memory = new Map<string, unknown>()
const BINGO_BUCKET = process.env.SUPABASE_BINGO_BUCKET || 'bingo-photos'

function readLocalState(): unknown | null {
  if (process.env.VERCEL) return null
  try {
    const fs = require('fs') as typeof import('fs')
    const path = require('path') as typeof import('path')
    const file = path.join(process.cwd(), '.data', 'bbq-store.json')
    if (!fs.existsSync(file)) return null
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function writeLocalState(value: unknown): void {
  if (process.env.VERCEL) return
  try {
    const fs = require('fs') as typeof import('fs')
    const path = require('path') as typeof import('path')
    const file = path.join(process.cwd(), '.data', 'bbq-store.json')
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(value))
  } catch (error) {
    console.error('writeLocalState failed', error)
  }
}

export async function persistGet<T = unknown>(key: string): Promise<T | null> {
  if (memory.has(key)) return memory.get(key) as T
  if (key === STATE_KEY) {
    const local = readLocalState()
    if (local != null) return local as T
  }
  return null
}

export async function persistSet(key: string, value: unknown): Promise<void> {
  memory.set(key, value)
  if (key === STATE_KEY) writeLocalState(value)
}

export async function persistGetState<T = unknown>(): Promise<T | null> {
  return persistGet<T>(STATE_KEY)
}

export async function persistSetState(value: unknown): Promise<void> {
  await persistSet(STATE_KEY, value)
}

function dataUrlToUpload(dataUrl: string): { bytes: Uint8Array; contentType: string } {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl)
  if (!match) throw new Error('Invalid photo data URL')
  return { bytes: Uint8Array.from(Buffer.from(match[2], 'base64')), contentType: match[1] }
}

export async function persistGetPhoto(cellId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    const value = memory.get('photo:' + cellId)
    return typeof value === 'string' ? value : null
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.storage.from(BINGO_BUCKET).createSignedUrl(cellId + '.jpg', 60 * 60)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function persistSetPhoto(cellId: string, dataUrl: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    memory.set('photo:' + cellId, dataUrl)
    return
  }

  const { bytes, contentType } = dataUrlToUpload(dataUrl)
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage.from(BINGO_BUCKET).upload(cellId + '.jpg', bytes, {
    contentType,
    upsert: true,
    cacheControl: '3600',
  })
  if (error) throw new Error('Bingo photo upload failed: ' + error.message)
}
