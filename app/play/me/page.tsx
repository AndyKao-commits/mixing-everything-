'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SOURCE_LABEL } from '@/lib/scoring'
import { clearPlayerSession, getPlayerToken } from '@/lib/client-session'
import { api } from '@/lib/api'
import { usePlayerView } from '@/hooks/usePlayerView'

export default function MePage() {
  const { data } = usePlayerView(3000)
  const [showAll, setShowAll] = useState(false)
  const [pushState, setPushState] = useState<'checking' | 'ready' | 'enabled' | 'denied' | 'unsupported' | 'ios-home'>('checking')
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (!cancelled) setPushState('unsupported')
        return
      }
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
      if (isiOS && !standalone) {
        if (!cancelled) setPushState('ios-home')
        return
      }
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const existing = await registration.pushManager.getSubscription()
        if (!cancelled) setPushState(existing ? 'enabled' : Notification.permission === 'denied' ? 'denied' : 'ready')
      } catch {
        if (!cancelled) setPushState('unsupported')
      }
    })()
    return () => { cancelled = true }
  }, [])

  function vapidKeyToBytes(value: string) {
    const pad = '='.repeat((4 - (value.length % 4)) % 4)
    const base64 = (value + pad).replace(/-/g, '+').replace(/_/g, '/')
    const raw = atob(base64)
    return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
  }

  async function enablePush() {
    const token = getPlayerToken()
    if (!token) return
    setPushBusy(true)
    setPushError('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushState(permission === 'denied' ? 'denied' : 'ready')
        return
      }
      const registration = await navigator.serviceWorker.register('/sw.js')
      const { publicKey } = await api.pushConfig(token)
      if (!publicKey) throw new Error('通知服務尚未設定完成')
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKeyToBytes(publicKey),
        })
      }
      await api.pushSubscribe(token, subscription.toJSON())
      setPushState('enabled')
    } catch (error) {
      setPushError(error instanceof Error ? error.message : '通知開啟失敗')
    } finally {
      setPushBusy(false)
    }
  }

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

      <section className="card space-y-3">
        <div>
          <h2 className="font-semibold">活動通知</h2>
          <p className="mt-1 text-sm text-soft">團康、按鈕大戰、最後留言與結算開始時提醒你回來。</p>
        </div>
        {pushState === 'enabled' ? (
          <p className="rounded-2xl bg-moss/10 p-3 text-sm font-semibold text-moss">✓ 活動通知已開啟</p>
        ) : pushState === 'ios-home' ? (
          <div className="rounded-2xl bg-paper p-3 text-sm leading-relaxed text-soft">
            iPhone / iPad 請先用 Safari「分享 → 加入主畫面」，再從主畫面打開本站，就能開啟通知。
          </div>
        ) : pushState === 'denied' ? (
          <p className="rounded-2xl bg-paper p-3 text-sm text-soft">通知權限已被關閉，請到瀏覽器或手機網站設定重新允許。</p>
        ) : pushState === 'unsupported' ? (
          <p className="rounded-2xl bg-paper p-3 text-sm text-soft">這個瀏覽器目前不支援 Web Push 通知。</p>
        ) : (
          <button type="button" className="btn-primary" disabled={pushBusy || pushState === 'checking'} onClick={() => void enablePush()}>
            {pushBusy ? '正在開啟…' : pushState === 'checking' ? '檢查通知支援…' : '開啟活動通知'}
          </button>
        )}
        {pushError ? <p className="text-sm text-ember">{pushError}</p> : null}
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
        結束這次登入
      </Link>
    </div>
  )
}
