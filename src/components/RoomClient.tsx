'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { GameCard } from '@/components/GameCard'
import { PerfectManGame } from '@/components/games/PerfectManGame'
import { PlayerList } from '@/components/PlayerList'
import { RoomCode } from '@/components/RoomCode'
import { ENABLED_GAMES, UPCOMING_GAMES } from '@/data/games'
import { PLAYER_HEARTBEAT_MS, POLL_INTERVAL_MS } from '@/lib/constants'
import { partyApi } from '@/lib/party-api'
import {
  ensurePlayerId,
  getStoredNickname,
  saveLastRoom,
  saveNickname,
} from '@/lib/player-storage'
import type { RoomSnapshot } from '@/types/game'

export function RoomClient({ code }: { code: string }) {
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null)
  const [playerId, setPlayerId] = useState('')
  const [nickname, setNickname] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [needsJoin, setNeedsJoin] = useState(false)
  const [selectingGame, setSelectingGame] = useState(false)

  const me = useMemo(
    () => snapshot?.players.find((p) => p.id === playerId) ?? null,
    [snapshot, playerId],
  )

  const sync = useCallback(async () => {
    if (!playerId) return
    try {
      const result = await partyApi.heartbeat(code, playerId)
      setSnapshot(result.snapshot)
      setNeedsJoin(false)
      if (result.hostTransferredTo) {
        setToast(`房主已轉移給 ${result.hostTransferredTo} 👑`)
        window.setTimeout(() => setToast(''), 3200)
      }
    } catch {
      try {
        const { snapshot: room } = await partyApi.getRoom(code)
        setSnapshot(room)
        const stillIn = room.players.some((p) => p.id === playerId)
        setNeedsJoin(!stillIn)
      } catch (err) {
        setError(err instanceof Error ? err.message : '房間不存在')
      }
    }
  }, [code, playerId])

  useEffect(() => {
    const id = ensurePlayerId()
    setPlayerId(id)
    setNickname(getStoredNickname())
  }, [])

  useEffect(() => {
    if (!playerId) return
    void sync()
    const poll = window.setInterval(() => void sync(), POLL_INTERVAL_MS)
    const beat = window.setInterval(() => void sync(), PLAYER_HEARTBEAT_MS)
    return () => {
      window.clearInterval(poll)
      window.clearInterval(beat)
    }
  }, [playerId, sync])

  async function join() {
    if (!nickname.trim()) {
      setError('請輸入代號')
      return
    }
    setJoining(true)
    setError('')
    try {
      const { snapshot: room } = await partyApi.joinRoom(code, nickname.trim(), playerId)
      saveNickname(nickname.trim())
      saveLastRoom(code)
      setSnapshot(room)
      setNeedsJoin(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加入失敗')
    } finally {
      setJoining(false)
    }
  }

  async function selectGame(gameId: string) {
    if (!me?.is_host) return
    setError('')
    try {
      const { snapshot: room } = await partyApi.selectGame(code, playerId, gameId)
      setSnapshot(room)
      setSelectingGame(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : '選擇失敗')
    }
  }

  if (error && !snapshot) {
    return (
      <div className="page-shell flex min-h-dvh items-center justify-center">
        <div className="text-center">
          <p className="font-display text-2xl font-semibold text-ink">{error}</p>
          <a href="/" className="btn-primary mt-6 inline-flex">
            回首頁
          </a>
        </div>
      </div>
    )
  }

  if (!snapshot || !playerId) {
    return (
      <div className="page-shell flex min-h-dvh items-center justify-center">
        <p className="text-soft">進入房間中…</p>
      </div>
    )
  }

  if (needsJoin || !me) {
    return (
      <div className="page-shell flex min-h-dvh flex-col justify-center gap-6">
        <div className="text-center">
          <p className="text-sm tracking-[0.2em] text-soft">加入房間</p>
          <p className="mt-2 font-display text-5xl font-bold tracking-[0.18em] text-ink">{code}</p>
        </div>
        <label className="block space-y-2">
          <span className="text-sm text-soft">你的代號</span>
          <input
            className="field"
            value={nickname}
            maxLength={12}
            placeholder="例如 Andy"
            onChange={(e) => setNickname(e.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-coral">{error}</p> : null}
        <button type="button" className="btn-primary" disabled={joining} onClick={join}>
          加入
        </button>
      </div>
    )
  }

  if (snapshot.session && snapshot.room.status === 'playing') {
    return (
      <div className="page-shell min-h-dvh py-6">
        {toast ? <div className="toast">{toast}</div> : null}
        <PerfectManGame
          code={code}
          playerId={playerId}
          isHost={me.is_host}
          snapshot={snapshot}
          onUpdate={setSnapshot}
        />
      </div>
    )
  }

  if (selectingGame) {
    return (
      <div className="page-shell min-h-dvh space-y-6 py-6">
        <button type="button" className="text-sm text-soft" onClick={() => setSelectingGame(false)}>
          ← 回房間
        </button>
        <h1 className="font-display text-3xl font-bold text-ink">選擇遊戲</h1>
        <div className="space-y-3">
          {ENABLED_GAMES.map((game) => (
            <GameCard
              key={game.id}
              {...game}
              onClick={() => void selectGame(game.id)}
            />
          ))}
          {UPCOMING_GAMES.map((game) => (
            <GameCard key={game.name} {...game} enabled={false} />
          ))}
        </div>
        {error ? <p className="text-sm text-coral">{error}</p> : null}
      </div>
    )
  }

  return (
    <div className="page-shell min-h-dvh space-y-8 py-6">
      {toast ? <div className="toast">{toast}</div> : null}
      <RoomCode code={code} />

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">玩家</h2>
          <p className="text-sm text-soft">{snapshot.players.length} 人</p>
        </div>
        <PlayerList players={snapshot.players} />
      </section>

      <div className="sticky bottom-4 space-y-3">
        {me.is_host ? (
          <button type="button" className="btn-primary w-full" onClick={() => setSelectingGame(true)}>
            選擇遊戲
          </button>
        ) : (
          <p className="rounded-3xl bg-white/75 px-4 py-5 text-center text-soft shadow-pop">
            等待房主選擇遊戲…
          </p>
        )}
        {error ? <p className="text-center text-sm text-coral">{error}</p> : null}
      </div>
    </div>
  )
}
