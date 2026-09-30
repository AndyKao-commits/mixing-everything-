'use client'

import Link from 'next/link'
import { useState } from 'react'
import { SOURCE_LABEL } from '@/lib/scoring'
import { clearPlayerSession } from '@/lib/client-session'
import { usePlayerView } from '@/hooks/usePlayerView'

export default function MePage() {
  const { data } = usePlayerView(3000)
  const [showAll, setShowAll] = useState(false)

  if (!data) return <p className="py-20 text-center text-soft">載入中…</p>

  const grouped: Record<string, number> = {}
  for (const t of data.txs || []) {
    grouped[t.source_type] = (grouped[t.source_type] || 0) + t.points
  }

  return (
    <div className="space-y-5 animate-rise">
      <header>
        <h1 className="font-display text-3xl font-bold">{data.player.name}</h1>
        <p className="mt-2 text-soft">目前積分</p>
        <p className="font-display text-5xl font-bold text-ember tabular-nums">{data.score}</p>
      </header>

      <section className="card space-y-2">
        <h2 className="font-semibold">積分紀錄</h2>
        {Object.keys(grouped).length === 0 ? (
          <p className="text-soft">還沒有分數，去吃吃喝喝順便做任務吧。</p>
        ) : (
          Object.entries(grouped).map(([k, v]) => (
            <div key={k} className="flex justify-between text-base">
              <span>{SOURCE_LABEL(k)}</span>
              <span className="font-semibold tabular-nums">+{v}</span>
            </div>
          ))
        )}
      </section>

      <button type="button" className="btn-secondary" onClick={() => setShowAll((v) => !v)}>
        {showAll ? '收起詳細紀錄' : '查看詳細紀錄'}
      </button>

      {showAll ? (
        <div className="space-y-2">
          {(data.txs || [])
            .slice()
            .reverse()
            .map((t: any) => (
              <div key={t.id} className="card flex justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{SOURCE_LABEL(t.source_type)}</p>
                  <p className="text-soft">{t.note || ''}</p>
                </div>
                <p className="font-semibold">+{t.points}</p>
              </div>
            ))}
        </div>
      ) : null}

      <Link href="/join" className="btn-secondary" onClick={() => clearPlayerSession()}>
        切換玩家
      </Link>
    </div>
  )
}
