'use client'

import { usePlayerView } from '@/hooks/usePlayerView'

export default function PlayHomePage() {
  const { data, loading } = usePlayerView()

  if (loading || !data) {
    return <p className="py-20 text-center text-soft">載入中…</p>
  }

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <h1 className="font-display text-3xl font-bold">嗨，{data.player.name} 👋</h1>
        <p className="mt-1 text-soft">今天就好好玩。</p>
      </header>

      <section className="card text-center">
        <p className="text-sm text-soft">目前積分</p>
        <p className="mt-1 font-display text-6xl font-bold text-ember tabular-nums">{data.score}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-soft">進行中的活動</h2>
        <div className="card">
          <p className="text-lg font-semibold">📸 九宮格獵人</p>
          <p className="mt-1 text-soft">完成 {data.completedBingo} / 9</p>
        </div>
        <div className="card">
          <p className="text-lg font-semibold">🚨 懸賞</p>
          <p className="mt-1 text-soft">還有 {data.bountyRemaining} 個可以完成</p>
        </div>
        {data.target ? (
          <div className="card">
            <p className="text-lg font-semibold">🎯 懸賞某人</p>
            <p className="mt-1 text-soft">
              {data.target.completed ? '已完成' : '進行中'}
            </p>
          </div>
        ) : null}
      </section>

      {data.event.status === 'settlement' || data.event.status === 'finished' ? (
        <a href="/play/games" className="btn-primary">
          查看結算結果
        </a>
      ) : null}
    </div>
  )
}
