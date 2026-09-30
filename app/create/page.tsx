'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { partyApi } from '@/lib/party-api'
import { ensurePlayerId, saveLastRoom, saveNickname, getStoredNickname } from '@/lib/player-storage'

export default function CreateRoomPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setNickname(getStoredNickname())
  }, [])

  async function create() {
    if (!nickname.trim()) {
      setError('請輸入代號')
      return
    }
    setBusy(true)
    setError('')
    try {
      const playerId = ensurePlayerId()
      const { snapshot } = await partyApi.createRoom(nickname.trim(), playerId)
      saveNickname(nickname.trim())
      saveLastRoom(snapshot.room.code)
      router.push(`/room/${snapshot.room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '建立失敗')
      setBusy(false)
    }
  }

  return (
    <main className="page-shell flex min-h-dvh flex-col justify-center gap-6 py-10">
      <div>
        <a href="/" className="text-sm text-soft">
          ← 回首頁
        </a>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">建立房間</h1>
        <p className="mt-2 text-soft">先取個代號，朋友就能掃碼進來</p>
      </div>

      <label className="block space-y-2">
        <span className="text-sm text-soft">你的代號</span>
        <input
          className="field"
          value={nickname}
          maxLength={12}
          placeholder="Andy"
          autoFocus
          onChange={(e) => setNickname(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void create()
          }}
        />
      </label>

      {error ? <p className="text-sm text-coral">{error}</p> : null}

      <button type="button" className="btn-primary" disabled={busy} onClick={create}>
        {busy ? '建立中…' : '建立'}
      </button>
    </main>
  )
}
