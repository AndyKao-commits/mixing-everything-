'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { getPlayerToken } from '@/lib/client-session'
import { usePlayerView } from '@/hooks/usePlayerView'

export default function GamesPage() {
  const { data, refresh, setData } = usePlayerView(1000)
  const [text, setText] = useState('')
  const [clicks, setClicks] = useState(0)
  const [pendingClicks, setPendingClicks] = useState(0)
  const [sendingClicks, setSendingClicks] = useState(false)
  const pendingClicksRef = useRef(0)
  const sendingClicksRef = useRef(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [settlementCountdown, setSettlementCountdown] = useState<number | null>(null)
  const [left, setLeft] = useState<number | null>(null)

  const game = data?.groupGame
  const event = data?.event

  useEffect(() => {
    if (!game || game.kind !== 'final_button') return
    const tick = () => {
      const now = Date.now()
      const start = Number(game.payload.startedAt)
      const end = Number(game.payload.endsAt)
      if (now < start) setCountdown(Math.ceil((start - now) / 1000))
      else setCountdown(null)
      if (now >= start && now <= end) setLeft(Math.max(0, Math.ceil((end - now) / 1000)))
      else if (now > end) setLeft(0)
    }
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [game])

  useEffect(() => {
    if (event?.status !== 'settlement' || !event.donation_ends_at) return

    // The final-button game also uses `left`. Reset it before the settlement
    // timer takes ownership so the two phases can never flash each other's value.
    const tick = () => {
      setLeft(Math.max(0, Math.ceil((new Date(event.donation_ends_at).getTime() - Date.now()) / 1000)))
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [event?.status, event?.donation_ends_at])

  useEffect(() => {
    if (event?.status !== 'settlement' || !event.settlement_started_at) {
      setSettlementCountdown(null)
      return
    }
    const tick = () => {
      const elapsed = Date.now() - new Date(event.settlement_started_at).getTime()
      setSettlementCountdown(elapsed < 10_000 ? Math.max(1, 10 - Math.floor(elapsed / 1000)) : 0)
    }
    tick()
    const id = window.setInterval(tick, 100)
    return () => window.clearInterval(id)
  }, [event?.status, event?.settlement_started_at])

  const revealedIds = useMemo(
    () => new Set((game?.payload?.revealedPlayerIds as string[]) || []),
    [game],
  )

  async function sendDontCopy() {
    const token = getPlayerToken()
    if (!token || !text.trim()) return
    setBusy(true)
    try {
      await api.submitDontCopy(token, text.trim())
      setText('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  async function sendWhoWrote() {
    const token = getPlayerToken()
    if (!token || !text.trim()) return
    setBusy(true)
    try {
      await api.submitWhoWrote(token, text.trim())
      setText('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  async function vote(id: string) {
    const token = getPlayerToken()
    if (!token) return
    setBusy(true)
    try {
      await api.voteWhoWrote(token, id)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  function tap() {
    if (left === 0) return
    setClicks((n) => n + 1)
    pendingClicksRef.current += 1
    setPendingClicks(pendingClicksRef.current)
  }

  async function flushClicks() {
    const token = getPlayerToken()
    if (!token || sendingClicksRef.current || pendingClicksRef.current <= 0) return
    const batch = pendingClicksRef.current
    pendingClicksRef.current = 0
    setPendingClicks(0)
    sendingClicksRef.current = true
    setSendingClicks(true)
    try {
      await api.finalClick(token, Date.now(), batch)
    } catch {
      // A batch arriving after the server deadline is intentionally ignored.
    } finally {
      sendingClicksRef.current = false
      setSendingClicks(false)
    }
  }

  useEffect(() => {
    if (!game || game.kind !== 'final_button' || pendingClicks <= 0 || sendingClicks) return
    const delay = left !== null && left <= 1 ? 0 : 100
    const id = window.setTimeout(() => void flushClicks(), delay)
    return () => window.clearTimeout(id)
    // flushClicks intentionally uses refs so the final tap batch cannot be lost to stale state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingClicks, game, sendingClicks, left])

  useEffect(() => {
    if (game?.kind === 'final_button' && left === 0 && pendingClicksRef.current > 0) void flushClicks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, game?.kind])

  async function readyFinal() {
    const token = getPlayerToken()
    if (!token) return
    setBusy(true)
    try {
      setData(await api.finalReady(token))
    } catch (e) {
      setError(e instanceof Error ? e.message : '準備失敗')
    } finally {
      setBusy(false)
    }
  }

  async function sendMessage() {
    const token = getPlayerToken()
    if (!token || !text.trim()) return
    setBusy(true)
    try {
      await api.submitMessage(token, text.trim())
      setText('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  async function decide(choice: 'keep' | 'donate') {
    const token = getPlayerToken()
    if (!token) return
    if (choice === 'donate' && !window.confirm('確定把 NT$10 送給第二名？贈與後不能反悔。')) return
    setBusy(true)
    try {
      setData(await api.decidePrize(token, choice))
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  if (!data) return <p className="py-20 text-center text-soft">載入中…</p>

  // Settlement reveal
  if (event.status === 'settlement' && settlementCountdown !== null && settlementCountdown > 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center animate-rise">
        <p className="mb-4 tracking-[0.3em] text-soft">FINAL RESULT</p>
        <p className="font-display text-8xl font-bold tabular-nums">{settlementCountdown}</p>
      </div>
    )
  }

  if (event.status === 'settlement' || event.status === 'finished') {
    const rank = data.myRank
    const settlementLeft = event.donation_ends_at
      ? Math.max(0, Math.ceil((new Date(event.donation_ends_at).getTime() - Date.now()) / 1000))
      : 0
    if (!rank) return <p className="text-soft">等待排名…</p>
    const isTop = rank.rank <= 3
    const isSecond = rank.rank === 2
    const canDonate = rank.rank >= 4

    return (
      <div className={`space-y-5 animate-rise ${rank.rank > 3 ? 'rounded-3xl bg-ink p-5 text-white' : ''}`}>
        {isTop ? <p className="text-4xl" aria-hidden="true">🎉</p> : null}
        <p className="text-sm opacity-70">你的排名</p>
        <h1 className={`font-display font-bold ${rank.rank > 3 ? 'text-6xl text-red-500' : 'text-5xl text-ink'}`}>
          {rank.rank === 1 ? '🏆 第一名' : rank.rank === 2 ? '第二名' : rank.rank === 3 ? '第三名' : `第 ${rank.rank} 名`}
        </h1>
        <p className="text-2xl font-semibold">{data.player.name}</p>
        {rank.rank === 1 ? (
          <p className="font-display text-4xl font-bold text-ember">NT$1,069</p>
        ) : null}
        {rank.rank === 3 ? (
          <div>
            <p className="font-display text-4xl font-bold text-ember">NT$69</p>
            <p className="text-soft">安慰獎</p>
          </div>
        ) : null}
        {isSecond ? (
          <div className="card space-y-2 text-ink">
            <p>差一點就是第一。所以你沒有。</p>
            <p className="text-sm text-soft">60 秒拉獎金</p>
            <p className="font-display text-5xl font-bold text-ember animate-pulseNum">
              NT${data.donationTotal}
            </p>
            <p className="text-soft">
              {data.donors ? `${data.donors} 個人救了你` : '還沒有人救你'}
            </p>
            <p className="text-sm">倒數 {settlementLeft}s</p>
            {event.status === 'finished' || settlementLeft === 0 ? (
              <p className="font-semibold">
                TIME&apos;S UP · 最終獎金 NT${data.donationTotal}
                <br />
                {data.donors ? `${data.donors} 個人救了你。` : '沒有人救你。'}
              </p>
            ) : null}
          </div>
        ) : null}
        {canDonate ? (
          <div className="space-y-3">
            <p className="text-4xl font-bold text-red-400">NT$10</p>
            {settlementLeft > 0 && !data.prizeDecision?.choice ? (
              <p className="text-white/70">{settlementLeft} 秒內決定</p>
            ) : null}
            {data.prizeDecision?.choice ? (
              <p className="rounded-2xl bg-white/10 p-4">
                ✓ 已決定
                <br />
                你的獎金 NT${data.prizeDecision.choice === 'keep' ? 10 : 0}
              </p>
            ) : (
              <>
                <button type="button" className="btn-primary" disabled={busy} onClick={() => decide('donate')}>
                  贈與第二名
                </button>
                <button type="button" className="btn-secondary text-ink" disabled={busy} onClick={() => decide('keep')}>
                  領取 NT$10
                </button>
              </>
            )}
          </div>
        ) : null}
        {isTop && rank.rank !== 2 ? <p className="text-soft">好好享受這個夜晚。</p> : null}
        {error ? <p className="text-sm text-ember">{error}</p> : null}
      </div>
    )
  }

  // Message phase
  if (event.status === 'message') {
    return (
      <div className="space-y-4 animate-rise">
        <h1 className="font-display text-3xl font-bold">留一句話</h1>
        <p className="text-soft">
          今晚快結束了。有些話平常可能不會特別說。留一句話給今天在這裡的大家吧。
        </p>
        {data.messageSubmitted ? (
          <div className="card">已送出，等待大家完成後一起看。</div>
        ) : (
          <>
            <textarea
              className="field min-h-36"
              value={text}
              maxLength={280}
              placeholder="認真、搞笑、感謝都可以"
              onChange={(e) => setText(e.target.value)}
            />
            <button type="button" className="btn-primary" disabled={busy} onClick={sendMessage}>
              送出
            </button>
          </>
        )}
        {data.messagesReady && data.messagesPublic?.length ? (
          <div className="space-y-2">
            <p className="font-semibold">全部留言</p>
            {data.messagesPublic.map((m: any) => (
              <div key={m.id} className="card text-lg">
                「{m.text}」
              </div>
            ))}
          </div>
        ) : null}
        {error ? <p className="text-sm text-ember">{error}</p> : null}
      </div>
    )
  }

  if (!game || game.kind === 'none') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center animate-rise">
        <p className="font-display text-2xl font-semibold">現在沒有團體遊戲。</p>
        <p className="mt-2 text-soft">繼續吃、繼續聊 🍖</p>
      </div>
    )
  }

  if (game.kind === 'dont_copy_me') {
    const prompts = (game.payload.prompts as string[]) || []
    const prompt = prompts[game.round - 1] || prompts[0]
    return (
      <div className="space-y-5 text-center animate-rise">
        <p className="text-sm text-soft">不要跟我一樣 · 第 {game.round} 題</p>
        <h1 className="font-display text-3xl font-bold leading-snug">{prompt}</h1>
        <div className="card space-y-2">
          <p className="font-semibold">不用打字，直接一起喊答案。</p>
          <p className="text-sm text-soft">答案唯一的人由主持人勾選得分。</p>
        </div>
      </div>
    )
  }

  if (game.kind === 'who_wrote_it') {
    const mine = Boolean(game.payload.mySubmitted)
    const answerCount = Number(game.payload.answerCount || 0)
    const reveal = game.payload.reveal as { player_id: string; text: string } | undefined
    const current = game.payload.currentAnswer as { id: string; text: string } | undefined

    if (game.status === 'playing') {
      return (
        <div className="space-y-4 animate-rise">
          <h1 className="font-display text-3xl font-bold">誰寫的</h1>
          <p className="text-lg">{String(game.payload.prompt)}</p>
          {mine ? (
            <div className="card">已送出，等待其他人… {answerCount} 人完成</div>
          ) : (
            <>
              <textarea className="field min-h-32" value={text} onChange={(e) => setText(e.target.value)} />
              <button type="button" className="btn-primary" disabled={busy} onClick={sendWhoWrote}>
                匿名送出
              </button>
            </>
          )}
          {error ? <p className="text-sm text-ember">{error}</p> : null}
        </div>
      )
    }

    if (game.status === 'voting' && current) {
      return (
        <div className="space-y-4 animate-rise">
          <h1 className="font-display text-3xl font-bold">這是誰寫的？</h1>
          <div className="card text-xl font-medium">「{current.text}」</div>
          {game.payload.isCurrentAuthor ? (
            <div className="card">這題是你的答案，等大家猜就好。</div>
          ) : (
          <div className="space-y-2">
            {(data.roster || []).map((p: any) => {
              const disabled = revealedIds.has(p.id) || p.id === data.player.id
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled || busy}
                  className={`btn-secondary ${disabled ? 'line-through opacity-40' : ''}`}
                  onClick={() => vote(p.id)}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
          )}
          {error ? <p className="text-sm text-ember">{error}</p> : null}
        </div>
      )
    }

    if (game.status === 'round_result' && reveal) {
      return (
        <div className="space-y-4 animate-rise">
          <h1 className="font-display text-3xl font-bold">揭曉</h1>
          <div className="card text-xl">「{reveal.text}」</div>
          <p className="text-2xl font-semibold">作者已標記為揭曉</p>
          <p className="text-soft">等待主持人抽下一則…</p>
        </div>
      )
    }
  }

  if (game.kind === 'final_button') {
    const readyIds = new Set((game.payload.readyPlayerIds as string[]) || [])
    const readyCount = Number(game.payload.readyCount || readyIds.size)
    const playerCount = Number(game.payload.playerCount || data.roster?.length || 0)
    const startedAt = Number(game.payload.startedAt || 0)
    const results = (game.payload.results as Array<{ playerId: string; playerName: string; count: number; rank: number }>) || []

    if (game.payload.finished && results.length) {
      return (
        <div className="space-y-4 animate-rise">
          <p className="text-center tracking-[0.3em] text-soft">FINAL GAME RESULT</p>
          <h1 className="text-center font-display text-3xl font-bold">按鈕大賽排名</h1>
          {results.map((row) => (
            <div key={row.playerId} className="card flex items-center justify-between">
              <div><span className="mr-3 font-display text-2xl font-bold">#{row.rank}</span>{row.playerName}</div>
              <span className="font-semibold tabular-nums">{row.count} 下</span>
            </div>
          ))}
        </div>
      )
    }

    if (!startedAt) {
      const mineReady = readyIds.has(data.player.id)
      return (
        <div className="flex min-h-[65vh] flex-col items-center justify-center gap-6 text-center animate-rise">
          <p className="tracking-[0.3em] text-soft">FINAL GAME</p>
          <h1 className="font-display text-4xl font-bold">按鈕大賽</h1>
          <p className="text-soft">全員準備後，統一倒數 10 秒開始</p>
          <p className="font-display text-3xl font-bold tabular-nums">{readyCount} / {playerCount}</p>
          <button type="button" className="btn-primary max-w-xs" disabled={mineReady || busy} onClick={readyFinal}>
            {mineReady ? '✓ 已準備' : '我準備好了'}
          </button>
          {mineReady ? <p className="text-soft">等待其他玩家…</p> : null}
        </div>
      )
    }

    return (
      <div className="flex min-h-[65vh] flex-col items-center justify-center gap-6 text-center animate-rise">
        <p className="tracking-[0.3em] text-soft">FINAL GAME</p>
        {countdown !== null ? (
          <p className="font-display text-7xl font-bold">{countdown || 'GO'}</p>
        ) : (
          <>
            <p className="text-soft">剩餘 {left ?? 0} 秒</p>
            <button
              type="button"
              className="btn-primary max-w-xs text-2xl active:scale-95"
              onClick={tap}
              disabled={left === 0}
            >
              狂按
            </button>
            <p className="font-display text-4xl font-bold tabular-nums">{clicks}</p>
          </>
        )}
      </div>
    )
  }

  return null
}
