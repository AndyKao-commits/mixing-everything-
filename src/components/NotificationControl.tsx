'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getPlayerToken } from '@/lib/client-session'

type NoticeState = 'loading' | 'ready' | 'enabled' | 'denied' | 'unsupported' | 'install-ios' | 'error'

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
}

function vapidKey(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

export function NotificationControl() {
  const [state, setState] = useState<NoticeState>('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        if (!cancelled) setState('unsupported')
        return
      }
      if (isIos() && !isStandalone()) {
        if (!cancelled) setState('install-ios')
        return
      }
      if (Notification.permission === 'denied') {
        if (!cancelled) setState('denied')
        return
      }
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        const existing = await registration.pushManager.getSubscription()
        if (!cancelled) setState(existing ? 'enabled' : 'ready')
      } catch {
        if (!cancelled) setState('error')
      }
    }
    void check()
    return () => { cancelled = true }
  }, [])

  async function enable() {
    const token = getPlayerToken()
    if (!token) return
    setError('')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'ready')
        return
      }
      const { publicKey } = await api.pushConfig(token)
      if (!publicKey) throw new Error('通知服務尚未啟用')
      const registration = await navigator.serviceWorker.register('/sw.js')
      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey(publicKey),
        })
      }
      await api.pushSubscribe(token, subscription.toJSON())
      setState('enabled')
    } catch (e) {
      setError(e instanceof Error ? e.message : '通知開啟失敗')
      setState('error')
    }
  }

  if (state === 'loading' || state === 'unsupported') return null

  if (state === 'enabled') {
    return (
      <section className="card flex items-center justify-between gap-3 py-3">
        <div>
          <p className="font-semibold">🔔 活動通知已開啟</p>
          <p className="text-xs text-soft">團康、按鈕大戰、留言與結算會提醒你。</p>
        </div>
        <span className="shrink-0 text-sm font-semibold text-moss">已開啟</span>
      </section>
    )
  }

  if (state === 'install-ios') {
    return (
      <section className="card space-y-2 py-3">
        <p className="font-semibold">🔔 開啟活動通知</p>
        <p className="text-sm text-soft">iPhone 請先用 Safari「加入主畫面」，從主畫面開啟網站後就能啟用通知。</p>
      </section>
    )
  }

  if (state === 'denied') {
    return (
      <section className="card py-3">
        <p className="font-semibold">🔕 通知目前被瀏覽器封鎖</p>
        <p className="mt-1 text-sm text-soft">可到瀏覽器／網站通知設定重新允許。</p>
      </section>
    )
  }

  return (
    <section className="card space-y-3 py-3">
      <div>
        <p className="font-semibold">🔔 開啟活動通知</p>
        <p className="mt-1 text-sm text-soft">只提醒需要大家回手機的關鍵時刻，不會一直打擾。</p>
      </div>
      <button type="button" className="btn-secondary !min-h-11" onClick={() => void enable()}>
        開啟通知
      </button>
      {error ? <p className="text-xs text-ember">{error}</p> : null}
    </section>
  )
}
