'use client'

import { useCallback, useEffect, useState } from 'react'
import { PinPad } from '@/components/PinPad'
import { api } from '@/lib/api'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/client-session'

type Tab = 'overview' | 'players' | 'tasks' | 'games' | 'settle'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [state, setState] = useState<any>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async (t = token) => {
    if (!t) return
    try {
      setState(await api.adminState(t))
      setError('')
    } catch (e) {
      const message = e instanceof Error ? e.message : '暫時無法更新'
      setError(message)
      if (/管理員未登入|重新登入/.test(message)) {
        clearAdminToken()
        setToken(null)
      }
    }
  }, [token])

  useEffect(() => {
    const t = getAdminToken()
    if (t) {
      setToken(t)
      void refresh(t)
    }
  }, [refresh])

  useEffect(() => {
    if (!token) return
    let timer: number | undefined
    let stopped = false

    const schedule = () => {
      if (stopped) return
      timer = window.setTimeout(async () => {
        if (document.visibilityState === 'visible' && !busy) await refresh()
        schedule()
      }, 3000)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    schedule()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stopped = true
      if (timer) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [token, refresh, busy])

  useEffect(() => {
    if (pin.length === 4) {
      void (async () => {
        try {
          const res = await api.adminLogin(pin)
          setAdminToken(res.token)
          setToken(res.token)
          setState(res)
          setPin('')
        } catch (e) {
          setError(e instanceof Error ? e.message : '登入失敗')
          setPin('')
        }
      })()
    }
  }, [pin])

  async function act(action: string, payload: Record<string, unknown> = {}) {
    if (!token) return
    setBusy(true)
    setError('')
    try {
      const res = await api.adminAction(token, action, payload)
      if (res.rankings || res.event || res.players) setState(res)
      else await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失敗')
    } finally {
      setBusy(false)
    }
  }

  if (!token) {
    return (
      <main className="shell flex min-h-dvh flex-col justify-center gap-6 py-8">
        <a href="/" className="text-sm text-soft">
          ← 回首頁
        </a>
        <h1 className="font-display text-3xl font-bold">管理員</h1>
        <p className="text-soft">輸入管理員 PIN</p>
        <PinPad value={pin} onChange={setPin} />
        {error ? <p className="text-sm leading-relaxed text-ember">{error}</p> : null}
      </main>
    )
  }

  const event = state?.event
  const rankings = state?.rankings || []
  const players = state?.players || []
  const game = state?.groupGame
  const canExitPlayer = event?.status === 'setup' || event?.status === 'active'
  const nextAdminStep =
    event?.status === 'setup'
      ? '確認玩家後開始活動'
      : event?.status === 'active' && event?.active_group_game !== 'none'
        ? '目前正在團康，控制本輪或結束團康'
        : event?.status === 'active'
          ? '自由活動中，可開始團康或讓提早離場玩家退出本場'
          : event?.status === 'score_locked'
            ? '積分已鎖定，接下來開啟最後留言'
            : event?.status === 'message'
              ? '等待所有人留言完成後開始結算'
              : event?.status === 'settlement'
                ? '結算進行中，等待贈與倒數完成'
                : event?.status === 'finished'
                  ? '活動已完成，可保留回顧或清除本場資料'
                  : '依目前狀態進行'

  return (
    <main className="shell min-h-dvh space-y-4 py-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[0.2em] text-soft">ADMIN</p>
          <h1 className="font-display text-2xl font-bold">{event?.name || '活動'}</h1>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            clearAdminToken()
            setToken(null)
          }}
        >
          登出
        </button>
      </div>

      <div className="tab-row">
        {(
          [
            ['overview', '總覽'],
            ['players', '玩家'],
            ['tasks', '任務'],
            ['games', '團康'],
            ['settle', '結算'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab-chip ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-ember">{error}</p> : null}

      {tab === 'overview' ? (
        <div className="space-y-3">
          <div className="card border border-ember/20">
            <p className="text-xs font-semibold tracking-[0.16em] text-soft">現在該做什麼</p>
            <p className="mt-2 text-lg font-semibold">{nextAdminStep}</p>
          </div>

          <div className="card grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-soft">玩家</p>
              <p className="text-2xl font-bold">{players.length}</p>
            </div>
            <div>
              <p className="text-soft">狀態</p>
              <p className="text-2xl font-bold">{event?.status}</p>
            </div>
            <div>
              <p className="text-soft">團康</p>
              <p className="font-semibold">{event?.active_group_game || 'none'}</p>
            </div>
            <div>
              <p className="text-soft">鎖分</p>
              <p className="font-semibold">{event?.score_locked ? '是' : '否'}</p>
            </div>
          </div>
          {event?.status === 'setup' ? (
            <button type="button" className="btn-primary" disabled={busy} onClick={() => act('activate')}>
              開始活動（發放任務）
            </button>
          ) : null}
          <div className="card space-y-3 border border-ember/30">
            <div>
              <h2 className="font-semibold text-ember">活動資料管理</h2>
              <p className="mt-1 text-sm text-soft">活動結束後可清除所有玩家、PIN、分數、任務、照片、留言與結算資料。</p>
            </div>
            <button
              type="button"
              className="btn-ghost text-ember"
              disabled={busy}
              onClick={() => {
                const first = confirm('確定要清除本次活動的所有用戶與遊戲資料？照片也會永久刪除。')
                if (!first) return
                const phrase = prompt('此操作無法復原。請輸入「清除資料」確認：')
                if (phrase === '清除資料') void act('clear_event_data')
              }}
            >
              清除活動資料
            </button>
          </div>
          <div className="card space-y-2">
            <h2 className="font-semibold">完整排行榜（僅管理員）</h2>
            {rankings.map((r: any) => (
              <div key={r.player_id} className="flex justify-between">
                <span>
                  {r.rank}. {r.name}
                </span>
                <span className="font-semibold tabular-nums">{r.score}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'players' ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input className="field" value={name} placeholder="新玩家名稱" onChange={(e) => setName(e.target.value)} />
            <button
              type="button"
              className="rounded-2xl bg-ember px-4 font-semibold text-white"
              disabled={busy || !name.trim()}
              onClick={() => {
                void act('create_player', { name }).then(() => setName(''))
              }}
            >
              新增
            </button>
          </div>
          {players.map((p: any) => (
            <div key={p.id} className="card space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  className="field !py-2"
                  defaultValue={p.name}
                  onBlur={(e) => {
                    if (e.target.value !== p.name) void act('rename_player', { playerId: p.id, name: e.target.value })
                  }}
                />
                <span className="shrink-0 text-sm text-soft">{p.pin_set ? 'PIN✓' : '未設PIN'}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-secondary !min-h-10 text-sm"
                  onClick={() => {
                    const points = Number(prompt('調整分數（可負數）', '1'))
                    if (!Number.isFinite(points) || points === 0) return
                    const note = prompt('備註', '手動調整') || '手動調整'
                    void act('adjust_score', { playerId: p.id, points, note })
                  }}
                >
                  調分
                </button>
                <button
                  type="button"
                  className="btn-ghost text-ember"
                  disabled={busy || !canExitPlayer || (event?.status !== 'setup' && players.length <= 2)}
                  onClick={() => {
                    const setup = event?.status === 'setup'
                    const message = setup
                      ? `刪除 ${p.name}？`
                      : `確定讓 ${p.name} 退出本場？\\n\\n將移除他的分數、任務、排名與登入資格，並自動修復其他玩家受影響的指定任務。`
                    if (confirm(message)) void act('delete_player', { playerId: p.id })
                  }}
                >
                  {event?.status === 'setup' ? '刪除' : canExitPlayer ? '退出本場' : '已鎖定'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'tasks' ? (
        <div className="card space-y-2 text-sm text-soft">
          <p>活動開始後會自動發放：</p>
          <p>· 九宮格（受控隨機）</p>
          <p>· 秘密任務</p>
          <p>· 懸賞牆（20 題）</p>
          <p>· 懸賞某人（循環配對）</p>
          <p className="pt-2">任務完成採玩家自行勾選，不需審核。</p>
        </div>
      ) : null}

      {tab === 'games' ? (
        <div className="space-y-3">
          {event?.status === 'active' && event?.active_group_game === 'none' ? (
            <div className="card space-y-3">
              <p className="font-semibold">選擇下一個團康</p>
              <p className="text-sm text-soft">開始後其他無關操作會先收起來，避免主持時按錯。</p>
              <div className="space-y-2">
                <button type="button" className="btn-primary" disabled={busy} onClick={() => act('start_dont_copy')}>
                  開始「不要跟我一樣」· 約 5 分
                </button>
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => act('start_who_wrote')}>
                  開始「誰寫的」· 約 10–15 分
                </button>
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => act('start_final_button')}>
                  開始最後按鈕大戰
                </button>
              </div>
            </div>
          ) : null}

          {game?.kind === 'dont_copy_me' ? (
            <div className="card space-y-3">
              <p className="font-semibold">不要跟我一樣 · R{game.round}</p>
              <p>{(game.payload.prompts as string[])[game.round - 1]}</p>
              <p className="text-sm text-soft">勾選本題答案唯一的玩家：</p>
              <DontCopyScorer
                players={players}
                 onScore={(ids) => act('score_dont_copy', { uniquePlayerIds: ids })}
              />
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => act('next_dont_copy')}>
                下一題／結束
              </button>
            </div>
          ) : null}

          {game?.kind === 'who_wrote_it' ? (
            <div className="card space-y-3">
              <p className="font-semibold">誰寫的</p>
              <p className="text-sm">{String(game.payload.prompt)}</p>
              <p className="text-sm text-soft">
                已交卷 {(game.payload.answers as any[])?.length || 0} / {players.length}
              </p>
              {game.status === 'voting' ? (
                <button type="button" className="btn-primary" disabled={busy} onClick={() => act('reveal_who_wrote')}>
                  立即揭曉（不等未投票玩家）
                </button>
              ) : (
                <button type="button" className="btn-secondary" disabled={busy} onClick={() => act('draw_who_wrote')}>
                  抽下一則答案
                </button>
              )}
            </div>
          ) : null}

          {game?.kind === 'final_button' ? (
            <div className="card space-y-2 border border-ember/20">
              <p className="font-semibold">按鈕大戰進行中</p>
              <p className="text-sm text-soft">倒數與點擊結果會照目前已收到的資料結算。</p>
            </div>
          ) : null}

          {event?.active_group_game && event.active_group_game !== 'none' ? (
            <div className="card space-y-3 border border-ember/40">
              <div>
                <p className="font-semibold text-ember">主持人控制</p>
                <p className="mt-1 text-sm text-soft">
                  緊急中止目前團康。所有玩家下一次同步後會離開本輪，已完成的計分會保留。
                </p>
              </div>
              <button
                type="button"
                className="btn-ghost text-ember"
                disabled={busy}
                onClick={() => {
                  if (confirm('確定要強制結束目前團康？已完成的計分會保留，未完成流程會直接停止。')) {
                    void act('force_end_group_game')
                  }
                }}
              >
                強制結束目前團康
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'settle' ? (
        <div className="space-y-3">
          {event?.status === 'active' ? (
          <button
            type="button"
            className="btn-primary"
            disabled={busy || event?.score_locked}
            onClick={() => {
              if (confirm('確定鎖定積分？鎖定後所有任務將停止計分。')) void act('lock_scores')
            }}
          >
            鎖定積分
          </button>
          ) : null}
          {event?.status === 'score_locked' ? (
            <button type="button" className="btn-primary" disabled={busy} onClick={() => act('open_messages')}>
              開啟「留一句話」
            </button>
          ) : null}
          {(state?.ties || []).length ? (
            <TieBreakControls
              ties={state.ties}
              players={players}
              busy={busy || event?.status !== 'message' || (state?.messageCount || 0) < players.length}
              onStart={(tieBreakOrder) => act('start_settlement', { tieBreakOrder })}
            />
          ) : (
            <button
              type="button"
              className="btn-secondary"
              disabled={busy || event?.status !== 'message' || (state?.messageCount || 0) < players.length}
              onClick={() => {
                if (confirm('開始最終結算？所有手機將同步進排名揭曉。')) void act('start_settlement')
              }}
            >
              開始最終結算
            </button>
          )}
          <button type="button" className="btn-ghost" disabled={busy || event?.status !== 'settlement'} onClick={() => act('finish_event')}>
            結束活動（關閉 60 秒贈與）
          </button>
          {state?.settlement ? (
            <div className="card space-y-2">
              <p className="font-semibold">結算排名</p>
              {state.settlement.rankings.map((r: any) => {
                const p = players.find((x: any) => x.id === r.player_id)
                return (
                  <div key={r.player_id} className="flex justify-between text-sm">
                    <span>
                      #{r.rank} {p?.name}
                    </span>
                    <span>
                      {r.score} 分 · NT${r.prize}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : null}
          <div className="card space-y-2">
            <p className="font-semibold">留言</p>
            <p className="text-sm text-soft">已提交 {state?.messageCount || 0} / {players.length}</p>
            {(state?.messages || []).length === 0 ? (
              <p className="text-sm text-soft">{(state?.messageCount || 0) > 0 ? '全部提交前內容保持隱藏' : '尚無留言'}</p>
            ) : (
              state.messages.map((m: any) => (
                <p key={m.id} className="rounded-xl bg-paper p-3 text-sm">
                  「{m.text}」
                </p>
              ))
            )}
          </div>
        </div>
      ) : null}
    </main>
  )
}

function DontCopyScorer({
  players,
  onScore,
}: {
  players: any[]
  onScore: (ids: string[]) => void
}) {
  const [picked, setPicked] = useState<string[]>([])
  return (
    <div className="space-y-2">
      {players.map((p) => {
        const on = picked.includes(p.id)
        return (
          <button
            key={p.id}
            type="button"
            className={`w-full rounded-xl px-3 py-2 text-left text-sm ${on ? 'bg-moss text-white' : 'bg-paper'}`}
            onClick={() =>
              setPicked((prev) => (prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]))
            }
          >
            {p.name}
          </button>
        )
      })}
      <button type="button" className="btn-primary !min-h-12" onClick={() => onScore(picked)}>
        確認本題得分（{picked.length}）
      </button>
    </div>
  )
}


function TieBreakControls({
  ties,
  players,
  busy,
  onStart,
}: {
  ties: Array<{ score: number; players: Array<{ player_id: string }> }>
  players: any[]
  busy: boolean
  onStart: (order: string[]) => void
}) {
  const [orders, setOrders] = useState<string[][]>(() => ties.map((t) => t.players.map((p) => p.player_id)))
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name || '玩家'
  function move(group: number, index: number, delta: number) {
    setOrders((prev) => {
      const next = prev.map((x) => [...x])
      const target = index + delta
      if (target < 0 || target >= next[group].length) return prev
      ;[next[group][index], next[group][target]] = [next[group][target], next[group][index]]
      return next
    })
  }
  return (
    <div className="card space-y-3 border border-ember/30">
      <p className="font-semibold text-ember">前三名有同分，請決定順序</p>
      {orders.map((order, group) => (
        <div key={group} className="space-y-2">
          <p className="text-sm text-soft">同分 {ties[group]?.score} 分 · 上方名次較高</p>
          {order.map((id, index) => (
            <div key={id} className="flex items-center justify-between rounded-xl bg-paper p-2">
              <span className="font-semibold">{index + 1}. {nameOf(id)}</span>
              <div className="flex gap-1">
                <button type="button" className="btn-ghost !min-h-9 !px-3" disabled={index === 0} onClick={() => move(group, index, -1)}>↑</button>
                <button type="button" className="btn-ghost !min-h-9 !px-3" disabled={index === order.length - 1} onClick={() => move(group, index, 1)}>↓</button>
              </div>
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        className="btn-primary"
        disabled={busy}
        onClick={() => {
          if (confirm('確定依目前同分順序進行最終結算？')) onStart(orders.flat())
        }}
      >
        確認同分順序並開始結算
      </button>
    </div>
  )
}
