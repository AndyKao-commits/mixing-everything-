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

export async function persistGetPushPublicKey(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('web_push_config')
    .select('public_key')
    .eq('singleton', true)
    .maybeSingle()
  if (error) throw new Error('Push config read failed: ' + error.message)
  return data?.public_key ? String(data.public_key) : null
}

export async function persistSavePushSubscription(
  eventId: string,
  playerId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
): Promise<void> {
  if (!isSupabaseConfigured()) return
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('web_push_subscriptions').upsert({
    event_id: eventId,
    player_id: playerId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  }, { onConflict: 'endpoint' })
  if (error) throw new Error('Push subscription save failed: ' + error.message)
}

export async function persistSendPush(
  eventId: string,
  title: string,
  body: string,
  url = '/play/games',
): Promise<void> {
  if (!isSupabaseConfigured()) return
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.functions.invoke('send-party-push', {
    body: { eventId, title, body, url },
  })
  if (error) throw new Error('Push send failed: ' + error.message)
}


export async function persistDeletePushPlayer(playerId: string): Promise<void> {
  if (!isSupabaseConfigured() || !playerId) return
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('web_push_subscriptions').delete().eq('player_id', playerId)
  if (error) throw new Error('Push subscription cleanup failed: ' + error.message)
}

export async function persistClearPushSubscriptions(): Promise<void> {
  if (!isSupabaseConfigured()) return
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('web_push_subscriptions').delete().neq('endpoint', '')
  if (error) throw new Error('Push subscription cleanup failed: ' + error.message)
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


export async function persistClearPhotos(): Promise<void> {
  if (!isSupabaseConfigured()) {
    for (const key of [...memory.keys()]) if (key.startsWith('photo:')) memory.delete(key)
    return
  }
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.storage.from(BINGO_BUCKET).list('', { limit: 1000 })
  if (error) throw new Error('Bingo photo cleanup failed: ' + error.message)
  const paths = (data || []).filter((item) => item.name).map((item) => item.name)
  if (!paths.length) return
  const { error: removeError } = await supabase.storage.from(BINGO_BUCKET).remove(paths)
  if (removeError) throw new Error('Bingo photo cleanup failed: ' + removeError.message)
}


export async function persistDeletePhotos(cellIds: string[]): Promise<void> {
  const ids = [...new Set(cellIds.filter(Boolean))]
  if (!ids.length) return
  if (!isSupabaseConfigured()) {
    for (const id of ids) memory.delete('photo:' + id)
    return
  }
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.storage.from(BINGO_BUCKET).remove(ids.map((id) => id + '.jpg'))
  if (error) throw new Error('Bingo photo cleanup failed: ' + error.message)
}

export async function persistDeleteFinalButtonPlayer(playerKey: string): Promise<void> {
  if (!isSupabaseConfigured() || !playerKey) return
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('final_button_click_counts').delete().eq('player_key', playerKey)
  if (error) throw new Error('Final button player cleanup failed: ' + error.message)
}


export async function persistFinalButtonClicks(sessionKey: string, playerKey: string, clickCount: number, nowMs: number): Promise<number> {
  if (!isSupabaseConfigured()) return clickCount
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc('record_final_button_clicks', {
    p_session_key: sessionKey,
    p_player_key: playerKey,
    p_click_count: clickCount,
    p_now_ms: nowMs,
  })
  if (error) throw new Error('Final button counter failed: ' + error.message)
  return Number(data || 0)
}

export async function persistSetFinalButtonScore(sessionKey: string, playerKey: string, clickCount: number): Promise<number> {
  const count = Math.max(0, Math.floor(clickCount || 0))
  if (!isSupabaseConfigured()) return count
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase.rpc('set_final_button_score_max', {
    p_session_key: sessionKey,
    p_player_key: playerKey,
    p_click_count: count,
    p_now_ms: Date.now(),
  })
  if (error) throw new Error('Final button score save failed: ' + error.message)
  return Number(data ?? count)
}

export async function persistGetFinalButtonResults(sessionKey: string): Promise<Array<{ playerId: string; count: number }>> {
  if (!isSupabaseConfigured()) return []
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('final_button_click_counts')
    .select('player_key,click_count')
    .eq('session_key', sessionKey)
    .order('click_count', { ascending: false })
  if (error) throw new Error('Final button results failed: ' + error.message)
  return (data || []).map((row) => ({ playerId: String(row.player_key), count: Number(row.click_count) }))
}

export async function persistClearFinalButtonClicks(): Promise<void> {
  if (!isSupabaseConfigured()) return
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('final_button_click_counts').delete().neq('session_key', '')
  if (error) throw new Error('Final button cleanup failed: ' + error.message)
}
