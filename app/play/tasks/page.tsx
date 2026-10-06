'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { exportBingoImage } from '@/lib/bingo-export'
import { getPlayerToken } from '@/lib/client-session'
import { usePlayerView } from '@/hooks/usePlayerView'

type Tab = 'bingo' | 'secret' | 'bounty'

function cropSquareImage(file: File, offsetX = 50, offsetY = 50, zoom = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const coverScale = Math.max(1200 / img.width, 1200 / img.height)
      const scale = coverScale * zoom
      const drawnW = img.width * scale
      const drawnH = img.height * scale
      const overflowX = Math.max(0, drawnW - 1200)
      const overflowY = Math.max(0, drawnH - 1200)
      const dx = -overflowX * (offsetX / 100)
      const dy = -overflowY * (offsetY / 100)
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 1200
      canvas.getContext('2d')!.drawImage(img, dx, dy, drawnW, drawnH)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('照片讀取失敗'))
    }
    img.src = url
  })
}

export default function TasksPage() {
  const { data, refresh, setData } = usePlayerView(2500)
  const [tab, setTab] = useState<Tab>('bingo')
  const [activeCell, setActiveCell] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [cropUrl, setCropUrl] = useState('')
  const [cropX, setCropX] = useState(50)
  const [cropY, setCropY] = useState(50)
  const [cropZoom, setCropZoom] = useState(1)
  const [bingoPhotos, setBingoPhotos] = useState<Record<string, string>>({})
  const cameraInput = useRef<HTMLInputElement>(null)
  const libraryInput = useRef<HTMLInputElement>(null)
  const cropDrag = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null)

  const cells = data?.bingo?.cells || []

  const sortedBounties = useMemo(
    () => (data?.bounties || []).slice().sort((a: any, b: any) => Number(a.completed) - Number(b.completed)),
    [data],
  )


  async function loadBingoPhotos() {
    const token = getPlayerToken()
    if (!token) return {}
    const result = await api.bingoPhotos(token)
    if (result.eventId !== data?.event?.id || result.playerId !== data?.player?.id) return {}
    setBingoPhotos(result.photos)
    return result.photos
  }

  useEffect(() => {
    if (tab !== 'bingo' || !data?.bingo) return
    void loadBingoPhotos().catch(() => {})
    // Load photos only when the bingo tab is actually shown, never in global polling.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, data?.event?.id, data?.player?.id, data?.bingo?.id])

  async function onReveal(cellId: string) {
    const token = getPlayerToken()
    if (!token) return
    setBusy(true)
    setError('')
    try {
      await api.revealMystery(token, cellId)
      setActiveCell(null)
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : '失敗')
    } finally {
      setBusy(false)
    }
  }

  async function onPhoto(file: File | null) {
    if (!file || !activeCell) return
    setCropFile(file)
    setCropUrl(URL.createObjectURL(file))
  }

  async function confirmCrop() {
    if (!cropFile || !activeCell) return
    const token = getPlayerToken()
    if (!token) return
    setBusy(true)
    setError('')
    try {
      const photo = await cropSquareImage(cropFile, cropX, cropY, cropZoom)
      const cellId = activeCell.id
      const view = await api.completeBingo(token, cellId, photo)
      setData(view)
      // Keep the just-captured image visible instantly while Storage remains authoritative.
      setBingoPhotos((current) => ({ ...current, [cellId]: photo }))
      setActiveCell(null)
      URL.revokeObjectURL(cropUrl)
      setCropFile(null)
      setCropUrl('')
      setCropX(50)
      setCropY(50)
      setCropZoom(1)
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
      // Export always refreshes this authenticated player's Storage URLs first.
      const latestPhotos = await loadBingoPhotos()
      const exportCells = data.bingo.cells.map((cell: any) => ({
        ...cell,
        photo_data_url: latestPhotos[cell.id] || bingoPhotos[cell.id] || null,
      }))
      const blob = await exportBingoImage({
        eventName: data.event.name,
        playerName: data.player.name,
        cells: exportCells,
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
                {cell.completed && (bingoPhotos[cell.id] || cell.photo_data_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={bingoPhotos[cell.id] || cell.photo_data_url} alt="" className="h-full w-full object-cover" />
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

      {cropFile ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/70 p-4">
          <div className="card w-full space-y-4">
            <div>
              <p className="text-sm text-soft">調整照片</p>
              <p className="text-xl font-semibold">選好要放進九宮格的 1:1 範圍</p>
            </div>
            <div
              className="aspect-square touch-none overflow-hidden rounded-2xl bg-black"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId)
                cropDrag.current = { x: e.clientX, y: e.clientY, startX: cropX, startY: cropY }
              }}
              onPointerMove={(e) => {
                const drag = cropDrag.current
                if (!drag) return
                const rect = e.currentTarget.getBoundingClientRect()
                setCropX(Math.max(0, Math.min(100, drag.startX - ((e.clientX - drag.x) / rect.width) * 100)))
                setCropY(Math.max(0, Math.min(100, drag.startY - ((e.clientY - drag.y) / rect.height) * 100)))
              }}
              onPointerUp={() => { cropDrag.current = null }}
              onPointerCancel={() => { cropDrag.current = null }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cropUrl}
                alt="裁切預覽"
                draggable={false}
                className="pointer-events-none h-full w-full select-none object-cover"
                style={{
                  objectPosition: `${cropX}% ${cropY}%`,
                  transform: `scale(${cropZoom})`,
                  transformOrigin: `${cropX}% ${cropY}%`,
                }}
              />
            </div>
            <p className="text-center text-sm text-soft">直接拖曳照片調整上下左右，再用滑桿縮放</p>
            <label className="block text-sm">縮放 <input className="w-full" type="range" min="1" max="3" step="0.05" value={cropZoom} onChange={(e) => setCropZoom(Number(e.target.value))} /></label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className="btn-ghost" onClick={() => { URL.revokeObjectURL(cropUrl); setCropFile(null); setCropUrl('') }}>重選</button>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void confirmCrop()}>使用這個範圍</button>
            </div>
          </div>
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
              <div className="space-y-3">
                <p className="text-moss">✓ 已完成</p>
                {activeCell.photo_data_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeCell.photo_data_url} alt="目前照片" className="aspect-square w-full rounded-2xl object-cover" />
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="btn-primary" disabled={busy} onClick={() => cameraInput.current?.click()}>重新拍照</button>
                  <button type="button" className="btn-ghost" disabled={busy} onClick={() => libraryInput.current?.click()}>重新選照片</button>
                </div>
                <input ref={cameraInput} type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => { const file = e.currentTarget.files?.[0] || null; e.currentTarget.value = ''; void onPhoto(file) }} />
                <input ref={libraryInput} type="file" accept="image/*" className="sr-only" onChange={(e) => { const file = e.currentTarget.files?.[0] || null; e.currentTarget.value = ''; void onPhoto(file) }} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn-primary" disabled={busy} onClick={() => cameraInput.current?.click()}>
                  拍照
                </button>
                <button type="button" className="btn-ghost" disabled={busy} onClick={() => libraryInput.current?.click()}>
                  選照片
                </button>
                <input
                  ref={cameraInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0] || null
                    e.currentTarget.value = ''
                    void onPhoto(file)
                  }}
                />
                <input
                  ref={libraryInput}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.currentTarget.files?.[0] || null
                    e.currentTarget.value = ''
                    void onPhoto(file)
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
