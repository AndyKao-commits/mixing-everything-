/**
 * Supabase-backed persistence for the party runtime.
 *
 * The game engine still operates on one in-memory aggregate per request, but
 * Supabase is the durable source of truth. A single JSON snapshot keeps the
 * migration atomic while the normalized tables remain available for the next
 * phase. Photos stay in private Storage and are referenced separately.
 */
import { AsyncLocalStorage } from 'node:async_hooks'
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase-admin'

const STATE_KEY = 'bbq-party-state-v2'
const LEGACY_STATE_KEY = 'bbq-party-state-v1'
const memory = new Map<string, unknown>()
const BINGO_BUCKET = process.env.SUPABASE_BINGO_BUCKET || 'bingo-photos'
const persistenceContext = new AsyncLocalStorage<{ loadedVersion: number }>()

export function beginPersistenceRequest(): void {
  persistenceContext.enterWith({ loadedVersion: 0 })
}

function context() {
  const current = persistenceContext.getStore()
  if (!current) throw new Error('Persistence request context is missing')
  return current
}

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

async function getRemoteState<T>(): Promise<T | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('app_state')
    .select('state, version')
    .eq('key', STATE_KEY)
    .maybeSingle()
  if (error) throw new Error('Supabase state read failed: ' + error.message)
  context().loadedVersion = Number(data?.version || 0)
  return (data?.state as T | undefined) ?? null
}

async function setRemoteState(value: unknown): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc('save_app_state', {
    p_expected_version: context().loadedVersion,
    p_next_state: value,
  })
  if (error) {
    if (/STATE_CONFLICT/i.test(error.message)) throw new Error('STATE_CONFLICT')
    throw new Error('Supabase state write failed: ' + error.message)
  }
  const ctx = context()
  ctx.loadedVersion = Number(data || ctx.loadedVersion + 1)
}

export async function persistGet<T = unknown>(key: string): Promise<T | null> {
  if (key === STATE_KEY || key === LEGACY_STATE_KEY) return persistGetState<T>()
  return (memory.get(key) as T | undefined) ?? null
}

export async function persistSet(key: string, value: unknown): Promise<void> {
  if (key === STATE_KEY || key === LEGACY_STATE_KEY) {
    await persistSetState(value)
    return
  }
  memory.set(key, value)
}

export async function persistGetState<T = unknown>(): Promise<T | null> {
  if (isSupabaseConfigured()) return getRemoteState<T>()
  const local = readLocalState()
  if (local != null) return local as T
  return (memory.get(STATE_KEY) as T | undefined) ?? null
}

export async function persistSetState(value: unknown): Promise<void> {
  if (isSupabaseConfigured()) {
    await setRemoteState(value)
    return
  }
  memory.set(STATE_KEY, value)
  writeLocalState(value)
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
  if (!dataUrl.startsWith('data:')) return
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
