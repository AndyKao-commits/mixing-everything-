'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { getPlayerToken } from '@/lib/client-session'

const IOS_GUIDE_KEY = 'ios-home-screen-guide-dismissed-v1'

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
}

function isSafari() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua)
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return Boolean(nav.standalone || window.matchMedia?.('(display-mode: standalone)').matches)
}

function IOSHomeScreenGuide() {
  const [open, setOpen] = useState(false)
  const [safari, setSafari] = useState(true)

  useEffect(() => {
    if (!isIOS() || isStandalone()) return
    setSafari(isSafari())

    try {
      if (window.localStorage.getItem(IOS_GUIDE_KEY) === '1') return
    } catch {}

    setOpen(true)
  }, [])

  function closeGuide() {
    try {
      window.localStorage.setItem(IOS_GUIDE_KEY, '1')
    } catch {}
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-3 sm:items-center sm:p-5">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        className="w-full max-w-md rounded-[2rem] bg-white p-5 shadow-2xl"
      >
        <div className="text-center">
          <p className="text-xs font-bold tracking-[0.18em] text-ember">iPHONE 玩家先做這一步</p>
          <h2 id="ios-install-title" className="mt-2 text-2xl font-bold text-ink">
            加入主畫面，才能收到活動通知
          </h2>
          <p className="mt-2 text-sm leading-6 text-soft">
            只要設定一次。之後請從桌面上的遊戲圖示開啟網站。
          </p>
        </div>

        {!safari ? (
          <div className="mt-4 rounded-2xl border border-ember/20 bg-ember/5 px-4 py-3 text-sm font-semibold text-ember">
            請先用 Safari 開啟這個網站，再依照下方步驟加入主畫面。
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-ink" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M12 16V3m0 0 4 4m-4-4L8 7" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 10H5.8A1.8 1.8 0 0 0 4 11.8v7.4A1.8 1.8 0 0 0 5.8 21h12.4a1.8 1.8 0 0 0 1.8-1.8v-7.4a1.8 1.8 0 0 0-1.8-1.8H17" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-ember">STEP 1</p>
              <p className="font-semibold text-ink">點 Safari 的「分享」按鈕</p>
              <p className="mt-0.5 text-xs text-soft">方框上面有一個向上箭頭的圖示</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm">
              <svg viewBox="0 0 24 24" className="h-7 w-7 text-ink" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M12 8v8M8 12h8" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-ember">STEP 2</p>
              <p className="font-semibold text-ink">選「加入主畫面」</p>
              <p className="mt-0.5 text-xs text-soft">往下滑分享選單就能找到</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl bg-paper p-3">
            <div className="grid h-12 w-12 shrink-0 grid-cols-2 gap-1 rounded-2xl bg-white p-2 shadow-sm" aria-hidden="true">
              <span className="rounded-md bg-ember/90" />
              <span className="rounded-md bg-ink/80" />
              <span className="rounded-md bg-moss/80" />
              <span className="rounded-md bg-ink/20" />
            </div>
            <div>
              <p className="text-xs font-bold text-ember">STEP 3</p>
              <p className="font-semibold text-ink">回到桌面，從遊戲圖示打開</p>
              <p className="mt-0.5 text-xs text-soft">第一次開啟後記得允許通知</p>
            </div>
          </div>
        </div>

        <button type="button" className="btn-primary mt-5" onClick={closeGuide}>
          已加入
        </button>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const [eventName, setEventName] = useState('今晚誰會贏？')
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    setHasSession(Boolean(getPlayerToken()))
    api.state().then((s) => setEventName(s.event?.name || '今晚誰會贏？')).catch(() => {})
  }, [])

  return (
    <>
      <IOSHomeScreenGuide />

      <main className="shell relative flex min-h-dvh flex-col justify-center py-10">
        <div className="animate-rise text-center">
          <p className="text-sm font-semibold tracking-[0.28em] text-soft">PARTY GAME</p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-tight text-ink">
            今晚誰會贏？
          </h1>
          <p className="mt-3 text-soft">{eventName}</p>
        </div>

        <div className="mt-12 space-y-3 animate-rise" style={{ animationDelay: '80ms' }}>
          <Link href={hasSession ? '/play' : '/join'} className="btn-primary">
            加入遊戲
          </Link>
          {hasSession ? (
            <Link href="/play" className="btn-secondary">
              回到我的遊戲
            </Link>
          ) : null}
        </div>

        <Link
          href="/admin"
          className="absolute bottom-6 right-4 text-xs font-medium text-soft/80 underline-offset-2 hover:underline"
        >
          管理員
        </Link>
      </main>
    </>
  )
}
