'use client'

import { useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { exportBingoImage } from '@/lib/bingo-export'
import { getPlayerToken } from '@/lib/client-session'
import { usePlayerView } from '@/hooks/usePlayerView'

type Tab = 'bingo' | 'secret' | 'bounty'

function compressImage(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.onerror = reject
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export default function TasksPage() {
  const { data, refresh, setData } = usePlayerView(2500)
  const [tab, setTab] = useState<Tab>('bingo')
  const [activeCell, setActiveCell] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const cells = data?.bingo?.cells || []

  const sortedBounties = useMemo(
    () => (data?.bounties || []).slice().sort((a: any, b: any) => Number(a.completed) - Number(b.completed)),
    [data],
  )

  async function onReveal(cellId: string) {
    const token = getPlayerToken()
    if (!token) return
    setBusy(true)
    setError('')
    try {
      await api.revealMystery(token, cellId)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  async function onPhoto(file: File | null) {
    if (!file || !activeCell) return
    const token = getPlayerToken()
    if (!token) return
    setBusy(true)
    setError('')
    try {
      const photo = await compressImage(file)
      const view = await api.completeBingo(token, activeCell.id, photo)
      setData(view)
      setActiveCell(null)
      setMsg('+1 分')
      setTimeout(() => setMsg(''), 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : '上傳失敗')
    } finally {
      setBusy(false)
    }
  }

  async function completeSecret() {
    const token = getPlayerToken()
    if (!token) return
    setBusy(true)
    try {
      setData(await api.completeSecret(token))
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  async function completeTarget() {
    const token = getPlayerToken()
    if (!token) return
    setBusy(true)
    try {
      setData(await api.completeTarget(token))
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  async function completeBounty(id: string) {
    const token = getPlayerToken()
    if (!token) return
    setBusy(true)
    try {
      setData(await api.completeBounty(token, id))
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  async function exportCard() {
    if (!data?.bingo) return
    setBusy(true)
    try {
      const blob = await exportBingoImage({
        eventName: data.event.name,
        playerName: data.player.name,
        cells: data.bingo.cells,
        completed: data.completedBingo,
      })
      const file = new File([blob], 'bingo.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: '我的九宮格' })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'bingo.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '匯出失敗')
    } finally {
      setBusy(false)
    }
  }

  if (!data) return <p className="py-20 text-center text-soft">載入中…</p>

  return (
    <div className="space-y-4 animate-rise">
      <h1 className="font-display text-3xl font-bold">任務</h1>
      <div className="tab-row">
        {[
          ['bingo', '九宮格'],
          ['secret', '秘密任務'],
          ['bounty', '懸賞'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`tab-chip ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id as Tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-ember">{error}</p> : null}
      {msg ? <p className="text-sm font-semibold text-moss">{msg}</p> : null}

      {tab === 'bingo' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {cells.map((cell: any) => (
              <button
                key={cell.id}
                type="button"
                className="aspect-square overflow-hidden rounded-2xl bg-white shadow-card"
                onClick={() => setActiveCell(cell)}
              >
                {cell.completed && cell.photo_data_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={cell.photo_data_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-2 text-center">
                    <span className="text-xl">{cell.mystery && !cell.revealed ? '？' : '📷'}</span>
                    <span className="mt-1 line-clamp-3 text-[11px] leading-tight text-soft">
                      {cell.mystery && !cell.revealed ? '神秘任務' : cell.text}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <button type="button" className="btn-secondary" disabled={busy} onClick={exportCard}>
            匯出九宮格
          </button>
        </div>
      ) : null}

      {tab === 'secret' ? (
        <div className="space-y-3">
          {data.secret ? (
            <div className="card space-y-3">
              <p className="text-sm text-soft">秘密任務 · +{data.secret.points}</p>
              <p className="text-xl font-semibold">{data.secret.text}</p>
              {data.secret.completed ? (
                <p className="font-medium text-moss">✓ 已完成</p>
              ) : (
                <button type="button" className="btn-primary" disabled={busy} onClick={completeSecret}>
                  ✓ 我完成了
                </button>
              )}
            </div>
          ) : (
            <p className="text-soft">活動開始後會發放秘密任務</p>
          )}

          {data.target ? (
            <div className="card space-y-3">
              <p className="text-sm text-soft">🎯 你的目標 · +{data.target.points}</p>
              <p className="text-xl font-semibold">{data.target.text}</p>
              {data.target.completed ? (
                <p className="font-medium text-moss">✓ 已完成</p>
              ) : (
                <button type="button" className="btn-primary" disabled={busy} onClick={completeTarget}>
                  ✓ 我完成了
                </button>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === 'bounty' ? (
        <div className="space-y-2">
          <p className="text-sm text-soft">懸賞牆 · 每人每個只能完成一次</p>
          {sortedBounties.map((b: any) => (
            <div key={b.id} className="card flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{b.text}</p>
                <p className="text-sm text-soft">+{b.points}</p>
              </div>
              {b.completed ? (
                <span className="shrink-0 text-sm font-semibold text-moss">✓ 已完成</span>
              ) : (
                <button
                  type="button"
                  className="shrink-0 rounded-xl bg-ember px-3 py-2 text-sm font-semibold text-white"
                  disabled={busy}
                  onClick={() => completeBounty(b.id)}
                >
                  完成
                </button>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {activeCell ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4">
          <div className="card w-full space-y-4 animate-rise">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-soft">九宮格任務</p>
                <p className="mt-1 text-xl font-semibold">
                  {activeCell.mystery && !activeCell.revealed ? '神秘任務' : activeCell.text}
                </p>
              </div>
              <button type="button" className="btn-ghost" onClick={() => setActiveCell(null)}>
                關閉
              </button>
            </div>
            {activeCell.mystery && !activeCell.revealed ? (
              <button
                type="button"
                className="btn-primary"
                disabled={busy}
                onClick={() => onReveal(activeCell.id)}
              >
                揭曉
              </button>
            ) : activeCell.completed ? (
              <p className="text-moss">✓ 已完成</p>
            ) : (
              <label className="btn-primary cursor-pointer">
                拍照／選照片
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => void onPhoto(e.target.files?.[0] || null)}
                />
              </label>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
