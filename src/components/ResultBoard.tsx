'use client'

import { useEffect, useState } from 'react'
import { PlayerAvatar } from '@/components/PlayerAvatar'
import type { Answer } from '@/types/game'
import type { Player } from '@/types/player'

export function ResultBoard({
  players,
  answers,
  reveal,
}: {
  players: Player[]
  answers: Answer[]
  reveal: boolean
}) {
  const rows = players
    .map((player) => {
      const answer = answers.find((a) => a.player_id === player.id)
      return { player, answer }
    })
    .sort((a, b) => (b.answer?.score ?? -999) - (a.answer?.score ?? -999))

  const validScores = rows
    .filter((r) => r.answer && !r.answer.missed)
    .map((r) => r.answer!.score)
  const average =
    validScores.length > 0
      ? validScores.reduce((sum, n) => sum + n, 0) / validScores.length
      : null

  const [displayAvg, setDisplayAvg] = useState(0)

  useEffect(() => {
    if (!reveal || average === null) return
    let frame = 0
    const frames = 24
    const tick = () => {
      frame += 1
      setDisplayAvg(Number(((average * frame) / frames).toFixed(1)))
      if (frame < frames) requestAnimationFrame(tick)
    }
    tick()
  }, [average, reveal])

  if (!reveal) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {rows.map(({ player }) => (
          <div
            key={player.id}
            className="flex flex-col items-center gap-2 rounded-3xl bg-white/70 p-4 shadow-pop"
          >
            <PlayerAvatar player={player} size="sm" />
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink/5 text-2xl">
              ?
            </div>
          </div>
        ))}
      </div>
    )
  }

  const scored = rows.filter((r) => r.answer && !r.answer.missed)
  const lowest = scored[scored.length - 1]
  const highest = scored[0]

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {rows.map(({ player, answer }, index) => {
          const extreme =
            (lowest && player.id === lowest.player.id) ||
            (highest && player.id === highest.player.id)
          return (
            <div
              key={player.id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                extreme ? 'bg-coral/10 animate-bounceSoft' : 'bg-white/70'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{player.avatar}</span>
                <span className="font-medium text-ink">
                  {player.is_host ? '👑 ' : ''}
                  {player.nickname}
                </span>
              </div>
              <span className="font-display text-3xl font-bold text-ink tabular-nums">
                {answer?.missed ? '來不及' : (answer?.score ?? '—')}
              </span>
            </div>
          )
        })}
      </div>
      {average !== null ? (
        <div className="rounded-3xl bg-ink px-5 py-4 text-center text-white">
          <p className="text-sm text-white/70">平均分數</p>
          <p className="font-display text-5xl font-bold tabular-nums">{displayAvg}</p>
        </div>
      ) : null}
    </div>
  )
}

export function ExtremeCallout({
  players,
  answers,
}: {
  players: Player[]
  answers: Answer[]
}) {
  const scored = answers.filter((a) => !a.missed)
  if (scored.length < 2) return null
  const sorted = [...scored].sort((a, b) => a.score - b.score)
  const low = sorted[0]
  const high = sorted[sorted.length - 1]
  const lowPlayer = players.find((p) => p.id === low.player_id)
  const highPlayer = players.find((p) => p.id === high.player_id)
  if (!lowPlayer || !highPlayer) return null

  return (
    <div className="animate-slide-up space-y-4 rounded-[2rem] bg-white/85 p-5 shadow-pop">
      <p className="font-display text-2xl font-semibold text-ink">來，解釋一下。</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-ink/5 p-4 text-center">
          <p className="text-xs text-soft">最低</p>
          <p className="mt-2 text-3xl">{lowPlayer.avatar}</p>
          <p className="mt-1 font-medium">{lowPlayer.nickname}</p>
          <p className="font-display text-4xl font-bold text-coral">{low.score}</p>
        </div>
        <div className="rounded-2xl bg-ink/5 p-4 text-center">
          <p className="text-xs text-soft">最高</p>
          <p className="mt-2 text-3xl">{highPlayer.avatar}</p>
          <p className="mt-1 font-medium">{highPlayer.nickname}</p>
          <p className="font-display text-4xl font-bold text-mint">{high.score}</p>
        </div>
      </div>
      <p className="text-center text-lg font-medium text-ink">你們兩個先解釋。</p>
    </div>
  )
}
