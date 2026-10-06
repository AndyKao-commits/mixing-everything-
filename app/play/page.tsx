'use client'

import { usePlayerView } from '@/hooks/usePlayerView'
import { NotificationControl } from '@/components/NotificationControl'

export default function PlayHomePage() {
  const { data, loading } = usePlayerView()

  if (loading || !data) {
    return <p className="py-20 text-center text-soft">載入中…</p>
  }

  const nextAction =
    data.event.status === 'setup'
      ? { title: '等待活動開始', detail: '主持人開始後，任務會自動發放。', href: null }
      : data.event.status === 'message'
        ? { title: '現在：留一句話', detail: '活動進入最後階段。', href: '/play/games' }
        : data.event.status === 'settlement' || data.event.status === 'finished'
          ? { title: '現在：查看結果', detail: '排名與獎金已進入結算。', href: '/play/games' }
          : data.event.active_group_game && data.event.active_group_game !== 'none'
            ? { title: '現在：團體遊戲', detail: '跟著主持人的節奏一起玩。', href: '/play/games' }
            : { title: '現在：自由完成任務', detail: '吃、聊、拍照，順手把任務完成。', href: '/play/tasks' }

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <h1 className="font-display text-3xl font-bold">嗨，{data.player.name} 👋</h1>
        <p className="mt-1 text-soft">今天就好好玩。</p>
      </header>

      <section className="card border border-ember/20">
        <p className="text-xs font-semibold tracking-[0.16em] text-soft">現在要做什麼</p>
        <p className="mt-2 text-xl font-bold">{nextAction.title}</p>
        <p className="mt-1 text-sm text-soft">{nextAction.detail}</p>
        {nextAction.href ? <a href={nextAction.href} className="btn-primary mt-4">前往</a> : null}
      </section>

      <NotificationControl />

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
