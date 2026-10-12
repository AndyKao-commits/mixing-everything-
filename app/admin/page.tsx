'use client'

import { useCallback, useEffect, useState } from 'react'
import { PinPad } from '@/components/PinPad'
import { api } from '@/lib/api'
import { exportBingoImage } from '@/lib/bingo-export'
import { clearAdminToken, getAdminToken, setAdminToken } from '@/lib/client-session'

type Tab = 'overview' | 'players' | 'tasks' | 'games' | 'notify' | 'settle'

export default function AdminPage() {
  const [token, setToken] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [tab, setTab] = useState<Tab>('overview')
  const [state, setState] = useState<any>(null)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [noticeTitle, setNoticeTitle] = useState('')
  const [noticeBody, setNoticeBody] = useState('')
  const [noticeSent, setNoticeSent] = useState('')
  const [noticePlayerIds, setNoticePlayerIds] = useState<string[]>([])
  const [testPin, setTestPin] = useState('')
  const [bingoGallery, setBingoGallery] = useState<any>(null)
  const [bingoLoading, setBingoLoading] = useState(false)
  const [exportingBingoId, setExportingBingoId] = useState<string | null>(null)

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

  async function loadBingoGallery() {
    if (!token) return
    setBingoLoading(true)
    setError('')
    try {
      setBingoGallery(await api.adminBingoGallery(token))
    } catch (e) {
      setError(e instanceof Error ? e.message : '九宮格載入失敗')
    } finally {
      setBingoLoading(false)
    }
  }

  async function exportPlayerBingo(playerId: string) {
    if (!token || exportingBingoId) return
    setExportingBingoId(playerId)
    setError('')
    try {
      // Fetch newly signed URLs for this player only. The gallery may be stale.
      const card = await api.adminBingoExport(token, playerId)
      const missingPhotos = card.cells.filter((cell) => cell.completed && !cell.photoUrl)
      if (missingPhotos.length) throw new Error(`有 ${missingPhotos.length} 張已完成照片無法讀取，請稍後再試`)
      const cells = [...card.cells]
        .sort((a, b) => a.index - b.index)
        .map((cell) => ({
          text: cell.text,
          completed: cell.completed,
          photo_data_url: cell.photoUrl,
        }))
      const blob = await exportBingoImage({
        eventName: card.eventName,
        playerName: card.player.name,
        cells,
        completed: card.completed,
      })
      const safeName = card.player.name.replace(/[\\/:*?"<>|]/g, '_')
      const file = new File([blob], `${safeName}-九宮格.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `${card.player.name} 的九宮格` })
          return
        } catch (error) {
          if ((error as Error)?.name === 'AbortError') return
          // Browsers with an unreliable share sheet can still download.
        }
      }
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setError(error instanceof Error ? error.message : '九宮格匯出失敗')
    } finally {
      setExportingBingoId(null)
    }
  }

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
                ? '等待全員準備、揭曉及贈與'
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
            ['notify', '通知'],
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

          <div className={`card space-y-3 border ${event?.entry_locked ? 'border-ember/40' : 'border-moss/30'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">玩家入口</p>
                <p className="mt-1 text-sm text-soft">
                  {event?.entry_locked
                    ? '目前已鎖定。玩家只能停留在首頁，無法加入或操作遊戲。'
                    : '目前已開放。玩家可以加入並進入遊戲。'}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${event?.entry_locked ? 'bg-ember/10 text-ember' : 'bg-moss/10 text-moss'}`}>
                {event?.entry_locked ? '已鎖定' : '已開放'}
              </span>
            </div>

            {event?.entry_locked ? (
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => {
                  if (confirm('確定要解除玩家入口鎖定？玩家將可以加入並進入遊戲。')) {
                    void act('set_entry_lock', { locked: false })
                  }
                }}
              >
                解除鎖定・開放玩家
              </button>
            ) : (
              <button
                type="button"
                className="btn-ghost text-ember"
                disabled={busy}
                onClick={() => {
                  if (confirm('確定要鎖定玩家入口？所有玩家會被送回首頁，暫時無法加入或操作遊戲。')) {
                    void act('set_entry_lock', { locked: true })
                  }
                }}
              >
                鎖定玩家入口
              </button>
            )}
          </div>

          <div className={`card space-y-3 border ${event?.test_access_enabled ? 'border-moss/40' : 'border-black/10'}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">內部測試</p>
                <p className="mt-1 text-sm text-soft">
                  {event?.test_access_enabled
                    ? '測試通道已開啟。持有測試 PIN 的裝置可在玩家入口鎖定時正常測試。'
                    : '對外鎖定時，可另外開一條只給測試裝置使用的通道。'}
                </p>
              </div>
              <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                event?.test_access_enabled ? 'bg-moss/10 text-moss' : 'bg-black/5 text-soft'
              }`}>
                {event?.test_access_enabled ? '測試中' : '未開啟'}
              </span>
            </div>

            <input
              className="field text-center text-xl tracking-[0.3em]"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={testPin}
              placeholder={event?.test_access_enabled ? '輸入新 PIN 可重新設定' : '設定 4 位測試 PIN'}
              onChange={(e) => setTestPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn-secondary"
                disabled={busy || testPin.length !== 4}
                onClick={() => {
                  const message = event?.test_access_enabled
                    ? '確定要更新測試 PIN？舊 PIN 將立即失效。'
                    : '確定要開啟內部測試？對外仍維持目前的玩家入口鎖定狀態。'
                  if (!confirm(message)) return
                  void act('set_test_access', { enabled: true, pin: testPin }).then(() => setTestPin(''))
                }}
              >
                {event?.test_access_enabled ? '更新測試 PIN' : '開啟內部測試'}
              </button>

              <button
                type="button"
                className="btn-ghost text-ember"
                disabled={busy || !event?.test_access_enabled}
                onClick={() => {
                  if (confirm('確定關閉內部測試？所有測試裝置的通行證會立即失效。')) {
                    void act('set_test_access', { enabled: false })
                    setTestPin('')
                  }
                }}
              >
                關閉內部測試
              </button>
            </div>

            <p className="text-xs leading-5 text-soft">
              建議正式活動開始前關閉內部測試，或直接解除玩家入口鎖定。
            </p>
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
          <div className="card space-y-3 border border-ember/20">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">🤖 測試機器人控制台</h2>
              <span className="text-xs text-soft">僅限獨立彩排場</span>
            </div>
            <p className="text-sm text-soft">建立 12 位虛擬玩家，模擬在線、累積分數、最後留言與全員準備。測試角色不會使用真人 PIN。</p>
            <p className="text-sm">機器人：{players.filter((p: any) => p.is_test_bot).length} 位 · 最近在線：{players.filter((p: any) => p.is_test_bot && p.last_seen_at && Date.now() - new Date(p.last_seen_at).getTime() < 60000).length} 位</p>
            {players.some((p: any) => p.is_test_bot) ? (
              <div className="space-y-2">
                <button type="button" className="btn-primary" disabled={busy || !event?.test_access_enabled} onClick={() => void act('simulate_test_bots')}>執行一輪機器人模擬</button>
                <p className="text-xs text-soft">依活動階段自動模擬：自由活動加分、最後留言、全員結算準備。每按一次執行一輪，不會在背景不斷消耗資源。</p>
                <button type="button" className="btn-ghost text-ember" disabled={busy || event?.status !== 'setup'} onClick={() => {
                  if (confirm('清除全部測試機器人？只能在活動開始前進行。')) void act('clear_test_bots')
                }}>清除測試機器人</button>
              </div>
            ) : (
              <button type="button" className="btn-primary" disabled={busy || event?.status !== 'setup' || !event?.test_access_enabled || players.length > 0} onClick={() => {
                if (confirm('建立 12 位測試機器人？僅限空白玩家名單，請勿在正式活動中使用。')) void act('create_test_bots', { count: 12 })
              }}>建立 12 位測試機器人</button>
            )}
            {!event?.test_access_enabled ? <p className="text-xs text-ember">請先到「總覽」開啟內部測試，才能操作機器人。</p> : null}
          </div>
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
                <span className="shrink-0 text-sm text-soft">{p.is_test_bot ? '🤖 BOT' : p.pin_set ? 'PIN✓' : '未設PIN'}</span>
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
        <div className="space-y-3">
          <div className="card space-y-3">
            <div>
              <p className="font-semibold">所有玩家九宮格</p>
              <p className="mt-1 text-sm text-soft">照片只在你按下載入時取得，不會加入管理員每 3 秒的背景同步。</p>
            </div>
            <button type="button" className="btn-primary" disabled={bingoLoading} onClick={() => void loadBingoGallery()}>
              {bingoLoading ? '正在載入所有九宮格…' : bingoGallery ? '重新整理所有九宮格' : '載入所有人的九宮格'}
            </button>
          </div>

          {bingoGallery?.players?.length ? (
            <div className="space-y-4">
              {bingoGallery.players.map((entry: any) => (
                <section key={entry.player.id} className="card space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-xl font-bold">{entry.player.name}</h2>
                    <span className="rounded-full bg-paper px-3 py-1 text-sm font-semibold">{entry.completed} / 9</span>
                  </div>

                  {entry.cells.length ? (
                    <>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={exportingBingoId !== null || bingoLoading}
                      onClick={() => void exportPlayerBingo(entry.player.id)}
                    >
                      {exportingBingoId === entry.player.id ? '正在產生九宮格圖片…' : `匯出 ${entry.player.name} 的九宮格`}
                    </button>
                    <div className="grid grid-cols-3 gap-2">
                      {entry.cells.map((cell: any) => (
                        <div key={cell.id} className="overflow-hidden rounded-2xl bg-paper">
                          <div className="aspect-square bg-black/5">
                            {cell.photoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cell.photoUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center p-2 text-center text-xs text-soft">
                                {cell.completed ? '照片載入失敗' : '尚未完成'}
                              </div>
                            )}
                          </div>
                          <p className="line-clamp-2 min-h-10 px-2 py-1.5 text-[10px] leading-tight text-soft">{cell.text}</p>
                        </div>
                      ))}
                    </div>
                    </>
                  ) : (
                    <p className="text-sm text-soft">尚未發放九宮格。</p>
                  )}
                </section>
              ))}
            </div>
          ) : bingoGallery ? (
            <div className="card text-sm text-soft">目前沒有可顯示的玩家九宮格。</div>
          ) : null}
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

      {tab === 'notify' ? (
        <div className="space-y-3">
          <div className="card space-y-3">
            <div>
              <p className="font-semibold">一鍵通知所有人</p>
              <p className="mt-1 text-sm text-soft">只會送給已開啟活動通知的玩家。</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['🎮 遊戲要開始囉', '快回來集合，團康準備開始！'],
                ['🔥 快回來烤肉', '大家在等你，快回來吃東西！'],
                ['📣 集合囉', '請大家回到活動區集合一下～'],
                ['🏆 要公布結果囉', '快回來看看今晚誰是冠軍！'],
              ].map(([title, body]) => (
                <button
                  key={title}
                  type="button"
                  className="btn-secondary text-left"
                  disabled={busy}
                  onClick={() => {
                    if (!confirm(`確定發送通知？\n\n${title}\n${body}`)) return
                    setNoticeSent('')
                    void act('send_notification', { title, body, url: '/play/games' }).then(() => setNoticeSent(`已送出：${title}`))
                  }}
                >
                  <span className="block font-semibold">{title}</span>
                  <span className="mt-1 block text-xs font-normal text-soft">{body}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-3">
            <div>
              <p className="font-semibold">自訂通知</p>
              <p className="mt-1 text-sm text-soft">標題最多 40 字，內容最多 160 字。</p>
            </div>
            <input
              className="field"
              maxLength={40}
              value={noticeTitle}
              placeholder="通知標題"
              onChange={(e) => setNoticeTitle(e.target.value)}
            />
            <textarea
              className="field min-h-28 resize-y"
              maxLength={160}
              value={noticeBody}
              placeholder="通知內容"
              onChange={(e) => setNoticeBody(e.target.value)}
            />

            <div className="space-y-2 rounded-2xl bg-paper p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">發送對象</p>
                  <p className="text-xs text-soft">可單選或多選；只有已開啟通知的裝置會收到。</p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {noticePlayerIds.length} / {players.length}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-ghost !min-h-9 !px-3 text-sm"
                  onClick={() => setNoticePlayerIds(players.map((p: any) => p.id))}
                >
                  全選
                </button>
                <button
                  type="button"
                  className="btn-ghost !min-h-9 !px-3 text-sm"
                  onClick={() => setNoticePlayerIds([])}
                >
                  取消全選
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {players.map((p: any) => {
                  const selected = noticePlayerIds.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`rounded-xl border px-3 py-3 text-left text-sm font-semibold transition ${
                        selected ? 'border-moss bg-moss text-white' : 'border-black/10 bg-white'
                      }`}
                      onClick={() =>
                        setNoticePlayerIds((prev) =>
                          prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id],
                        )
                      }
                    >
                      <span className="mr-2">{selected ? '✓' : '○'}</span>
                      {p.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={busy || !noticeTitle.trim() || !noticeBody.trim() || noticePlayerIds.length === 0}
              onClick={() => {
                const title = noticeTitle.trim()
                const body = noticeBody.trim()
                const names = players
                  .filter((p: any) => noticePlayerIds.includes(p.id))
                  .map((p: any) => p.name)
                  .join('、')
                if (!confirm(`確定發送給 ${noticePlayerIds.length} 人？\n${names}\n\n${title}\n${body}`)) return
                setNoticeSent('')
                void act('send_notification', {
                  title,
                  body,
                  url: '/play/games',
                  playerIds: noticePlayerIds,
                }).then(() => {
                  setNoticeSent(`已送出給 ${noticePlayerIds.length} 位指定玩家`)
                  setNoticeTitle('')
                  setNoticeBody('')
                })
              }}
            >
              發送給已選玩家（{noticePlayerIds.length}）
            </button>
            {noticeSent ? <p className="text-sm font-semibold text-moss">{noticeSent}</p> : null}
          </div>
        </div>
      ) : null}

      {tab === 'settle' ? (
        <div className="space-y-3">
          <div className="card space-y-2">
            <p className="text-xs font-semibold tracking-wider text-soft">結算流程</p>
            <p className="text-sm font-medium">鎖定積分 → 最後留言 → 全員準備 → 倒數揭曉 → 贈與獎金</p>
            <p className="text-sm text-soft">目前階段：{event?.status === 'active' ? '自由活動' : event?.status === 'score_locked' ? '待開啟留言' : event?.status === 'message' ? '留言收集中' : event?.status === 'settlement' ? (event.settlement_started_at ? '頒獎與贈與' : '等待全員準備') : event?.status === 'finished' ? '已結束' : '活動設定'}</p>
          </div>
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
                if (confirm('發起全員結算？玩家都按準備後才會共同倒數揭曉。')) void act('start_settlement')
              }}
            >
              發起全員集合結算
            </button>
          )}
          {event?.status === 'settlement' && !event.settlement_started_at ? (
            <div className="card space-y-3 border border-ember/30">
              <h2 className="font-semibold">全員集合 · 結算準備</h2>
              <p>已準備 {(event.settlement_ready_ids || []).length} / {players.length} 位</p>
              <p className="text-sm text-soft">未準備：{players.filter((p: any) => !(event.settlement_ready_ids || []).includes(p.id)).map((p: any) => `${p.name}${p.last_seen_at && Date.now() - new Date(p.last_seen_at).getTime() > 60000 ? '（可能離線）' : ''}`).join('、') || '全員已準備'}</p>
              <button type="button" className="btn-secondary" disabled={busy} onClick={() => { if (confirm('略過未準備玩家，開始同步倒數？')) void act('force_settlement_reveal') }}>主持人強制開始</button>
            </div>
          ) : null}
          <button type="button" className="btn-ghost" disabled={busy || event?.status !== 'settlement' || !event.settlement_started_at} onClick={() => act('finish_event')}>
            結束活動（關閉 60 秒贈與）
          </button>
          <div className="card space-y-2">
            <h2 className="font-semibold">活動健康監控／彩排檢查</h2>
            <p className="text-sm text-soft">最近 60 秒在線：{state?.presence?.online ?? '—'} / {state?.presence?.total ?? players.length} 位</p>
            <p className="text-xs text-soft">此處只讀取在線狀態；不會建立假玩家或清除資料。</p>
            <p className="text-xs text-soft">彩排檢查：多裝置準備、玩家離線、強制開始、共同倒數、照片更換及獎金。</p>
          </div>
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
