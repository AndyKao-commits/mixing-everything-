'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { partyApi } from '@/lib/party-api'
import { ensurePlayerId, getStoredNickname, saveLastRoom, saveNickname } from '@/lib/player-storage'

export default function JoinRoomPage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [nickname, setNickname] = useState('')
  const [step, setStep] = useState<'code' | 'nick'>('code')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setNickname(getStoredNickname())
  }, [])

  function nextFromCode() {
    const cleaned = code.replace(/\D/g, '').slice(0, 6)
    if (cleaned.length < 4) {
      setError('請輸入 4～6 位房號')
      return
    }
    setCode(cleaned)
    setError('')
    setStep('nick')
  }

  async function join() {
    if (!nickname.trim()) {
      setError('請輸入代號')
      return
    }
    setBusy(true)
    setError('')
    try {
      const playerId = ensurePlayerId()
      const { snapshot } = await partyApi.joinRoom(code, nickname.trim(), playerId)
      saveNickname(nickname.trim())
      saveLastRoom(snapshot.room.code)
      router.push(`/room/${snapshot.room.code}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加入失敗')
      setBusy(false)
    }
  }

  return (
    <main className="page-shell flex min-h-dvh flex-col justify-center gap-6 py-10">
      <div>
        <a href="/" className="text-sm text-soft">
          ← 回首頁
        </a>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink">加入房間</h1>
      </div>

      {step === 'code' ? (
        <>
          <label className="block space-y-2">
            <span className="text-sm text-soft">輸入房間代碼</span>
            <input
              className="field text-center font-display text-4xl tracking-[0.35em]"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              placeholder="••••"
              autoFocus
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') nextFromCode()
              }}
            />
          </label>
          {error ? <p className="text-sm text-coral">{error}</p> : null}
          <button type="button" className="btn-primary" onClick={nextFromCode}>
            下一步
          </button>
        </>
      ) : (
        <>
          <p className="text-center font-display text-4xl font-bold tracking-[0.2em] text-ink">
            {code}
          </p>
          <label className="block space-y-2">
            <span className="text-sm text-soft">你的代號</span>
            <input
              className="field"
              value={nickname}
              maxLength={12}
              placeholder="阿樂"
              autoFocus
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void join()
              }}
            />
          </label>
          {error ? <p className="text-sm text-coral">{error}</p> : null}
          <button type="button" className="btn-primary" disabled={busy} onClick={join}>
            {busy ? '加入中…' : '加入'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => setStep('code')}>
            改房號
          </button>
        </>
      )}
    </main>
  )
}
