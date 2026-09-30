'use client'

import { useEffect, useMemo, useState } from 'react'
import { ExtremeCallout, ResultBoard } from '@/components/ResultBoard'
import { QuestionCard } from '@/components/QuestionCard'
import { ScoreSlider } from '@/components/ScoreSlider'
import { CATEGORY_META, DEFAULT_CATEGORIES, SCORE_DEFAULT } from '@/lib/constants'
import { partyApi } from '@/lib/party-api'
import type { PerfectManMode, QuestionCategory, RoomSnapshot } from '@/types/game'

const MODES: Array<{ id: PerfectManMode; label: string; hint: string }> = [
  { id: 'classic', label: '經典模式', hint: '他是 10 分，但是……' },
  { id: 'reverse', label: '反向模式', hint: '他是 2 分，但是……' },
  { id: 'theme', label: '主題模式', hint: '自選題型開局' },
  { id: 'speed', label: '極速模式', hint: '3～5 秒內評分' },
]

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as QuestionCategory[]

export function PerfectManGame({
  code,
  playerId,
  isHost,
  snapshot,
  onUpdate,
}: {
  code: string
  playerId: string
  isHost: boolean
  snapshot: RoomSnapshot
  onUpdate: (snapshot: RoomSnapshot) => void
}) {
  const session = snapshot.session
  const [score, setScore] = useState(SCORE_DEFAULT)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<PerfectManMode>('classic')
  const [categories, setCategories] = useState<QuestionCategory[]>([...DEFAULT_CATEGORIES])
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  const myAnswer = useMemo(
    () => snapshot.answers.find((a) => a.player_id === playerId),
    [snapshot.answers, playerId],
  )

  useEffect(() => {
    if (session?.status !== 'answering' || !session.answering_deadline) {
      setSecondsLeft(null)
      return
    }
    const tick = () => {
      const left = Math.max(
        0,
        Math.ceil((new Date(session.answering_deadline!).getTime() - Date.now()) / 1000),
      )
      setSecondsLeft(left)
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [session?.status, session?.answering_deadline])

  async function run(action: () => Promise<{ snapshot: RoomSnapshot }>) {
    setBusy(true)
    setError('')
    try {
      const { snapshot: next } = await action()
      onUpdate(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗')
    } finally {
      setBusy(false)
    }
  }

  if (!session) return null

  if (session.status === 'mode_select') {
    return (
      <div className="space-y-6 animate-slide-up">
        <header className="text-center">
          <div className="text-5xl">💘</div>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">滿分男</h1>
          <p className="mt-2 text-soft">完美的人，到底可以被你扣到幾分？</p>
        </header>

        {isHost ? (
          <>
            <div className="space-y-3">
              {MODES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`w-full rounded-2xl px-4 py-4 text-left transition ${
                    mode === item.id ? 'bg-coral text-white shadow-glow' : 'bg-white/80 text-ink'
                  }`}
                  onClick={() => setMode(item.id)}
                >
                  <div className="font-display text-xl font-semibold">{item.label}</div>
                  <div className={`text-sm ${mode === item.id ? 'text-white/80' : 'text-soft'}`}>
                    {item.hint}
                  </div>
                </button>
              ))}
            </div>

            {(mode === 'theme' || mode === 'classic' || mode === 'speed' || mode === 'reverse') && (
              <div className="rounded-3xl bg-white/75 p-4">
                <p className="mb-3 text-sm font-medium text-soft">題目類型</p>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const meta = CATEGORY_META[cat]
                    const checked = categories.includes(cat)
                    return (
                      <label
                        key={cat}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                          checked ? 'bg-ink text-white' : 'bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => {
                            setCategories((prev) =>
                              checked ? prev.filter((c) => c !== cat) : [...prev, cat],
                            )
                          }}
                        />
                        <span>
                          {meta.icon} {meta.label}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            <button
              type="button"
              className="btn-primary w-full"
              disabled={busy || categories.length === 0}
              onClick={() =>
                run(() => partyApi.configurePerfectMan(code, playerId, mode, categories))
              }
            >
              進入遊戲
            </button>
          </>
        ) : (
          <p className="rounded-3xl bg-white/70 px-4 py-6 text-center text-soft">
            等待房主選擇模式…
          </p>
        )}
        {error ? <p className="text-center text-sm text-coral">{error}</p> : null}
      </div>
    )
  }

  if (session.status === 'question') {
    return (
      <div className="flex min-h-[70vh] flex-col justify-between gap-8 animate-slide-up">
        <div className="text-center">
          <div className="text-5xl">💘</div>
          <h1 className="mt-3 font-display text-4xl font-bold text-ink">滿分男</h1>
          <p className="mt-3 text-lg text-soft">
            {session.mode === 'reverse' ? '他原本是 2 分。' : '他原本是 10 分。'}
          </p>
          <p className="mt-1 text-lg text-soft">但是……</p>
          <p className="mt-6 text-sm text-soft">Round {session.round + 1}</p>
        </div>
        {isHost ? (
          <button
            type="button"
            className="btn-primary w-full"
            disabled={busy}
            onClick={() => run(() => partyApi.startQuestion(code, playerId))}
          >
            開始
          </button>
        ) : (
          <p className="text-center text-soft">等待房主開始…</p>
        )}
        {error ? <p className="text-center text-sm text-coral">{error}</p> : null}
      </div>
    )
  }

  if (session.status === 'answering' && snapshot.currentQuestion) {
    const q = snapshot.currentQuestion
    return (
      <div className="space-y-6 animate-slide-up">
        <div className="flex items-center justify-between text-sm text-soft">
          <span>Round {session.round}</span>
          {secondsLeft !== null ? (
            <span className="rounded-full bg-coral px-3 py-1 font-display text-white">
              {secondsLeft}s
            </span>
          ) : null}
        </div>
        <QuestionCard baseScore={q.base_score} text={q.text} mode={session.mode} />

        {myAnswer ? (
          <div className="rounded-3xl bg-white/80 p-6 text-center shadow-pop">
            <p className="text-soft">你給了</p>
            <p className="mt-2 font-display text-6xl font-bold text-coral">
              {myAnswer.missed ? '來不及' : `${myAnswer.score} 分`}
            </p>
            <p className="mt-4 text-soft">
              等待其他人… {snapshot.answers.length} / {snapshot.players.length} 已回答
            </p>
          </div>
        ) : (
          <>
            <ScoreSlider value={score} onChange={setScore} disabled={busy} />
            <button
              type="button"
              className="btn-primary w-full"
              disabled={busy}
              onClick={() => run(() => partyApi.submitAnswer(code, playerId, score))}
            >
              就這分
            </button>
          </>
        )}
        {error ? <p className="text-center text-sm text-coral">{error}</p> : null}
      </div>
    )
  }

  if (session.status === 'result' || session.status === 'discussion') {
    const extreme = [...snapshot.answers]
      .filter((a) => !a.missed)
      .sort((a, b) => a.score - b.score)
    const lowest = extreme[0]
    const roastPlayer = lowest
      ? snapshot.players.find((p) => p.id === lowest.player_id)
      : null

    return (
      <div className="space-y-6 animate-slide-up">
        <div className="text-center">
          <p className="text-sm text-soft">Round {session.round}</p>
          <h2 className="font-display text-3xl font-bold text-ink">公布結果</h2>
        </div>

        {snapshot.currentQuestion ? (
          <QuestionCard
            baseScore={snapshot.currentQuestion.base_score}
            text={snapshot.currentQuestion.text}
            mode={session.mode}
          />
        ) : null}

        <ResultBoard players={snapshot.players} answers={snapshot.answers} reveal />

        {roastPlayer && lowest ? (
          <div className="animate-bounceSoft rounded-[2rem] bg-coral px-5 py-6 text-center text-white shadow-glow">
            <p className="text-5xl">{roastPlayer.avatar}</p>
            <p className="mt-2 font-display text-4xl font-bold tabular-nums">{lowest.score}</p>
            <p className="mt-2 text-lg font-semibold">？？？ {roastPlayer.nickname} 你解釋一下</p>
          </div>
        ) : null}

        <ExtremeCallout players={snapshot.players} answers={snapshot.answers} />

        {isHost ? (
          <div className="space-y-3">
            <button
              type="button"
              className="btn-primary w-full"
              disabled={busy}
              onClick={() => run(() => partyApi.nextQuestion(code, playerId))}
            >
              下一題
            </button>
            <button
              type="button"
              className="btn-secondary w-full"
              disabled={busy}
              onClick={() => run(() => partyApi.backToLobby(code, playerId))}
            >
              回房間
            </button>
          </div>
        ) : (
          <p className="text-center text-soft">討論中，等待房主下一題…</p>
        )}
        {error ? <p className="text-center text-sm text-coral">{error}</p> : null}
      </div>
    )
  }

  return null
}
