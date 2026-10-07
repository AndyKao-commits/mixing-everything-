'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  clearTestAccessToken,
  getPlayerToken,
  setTestAccessToken,
} from '@/lib/client-session'

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
  const [entryLocked, setEntryLocked] = useState<boolean | null>(null)
  const [testAccess, setTestAccess] = useState(false)
  const [testAccessEnabled, setTestAccessEnabled] = useState(false)
  const [showTestLogin, setShowTestLogin] = useState(false)
  const [testPin, setTestPin] = useState('')
  const [testError, setTestError] = useState('')
  const [testBusy, setTestBusy] = useState(false)

  useEffect(() => {
    setHasSession(Boolean(getPlayerToken()))

    let stopped = false
    let timer: number | undefined

    const refreshState = async () => {
      try {
        const s = await api.state()
        if (stopped) return
        setEventName(s.event?.name || '今晚誰會贏？')
        setEntryLocked(Boolean(s.event?.entry_locked))
        setTestAccess(Boolean(s.testAccess))
        setTestAccessEnabled(Boolean(s.event?.test_access_enabled))
        if (!s.testAccess) clearTestAccessToken()
      } catch {
        if (!stopped) setEntryLocked(false)
      }
    }

    void refreshState()

    timer = window.setInterval(() => {
      void refreshState()
    }, 2000)

    return () => {
      stopped = true
      if (timer) window.clearInterval(timer)
    }
  }, [])

  return (
    <>
      <IOSHomeScreenGuide />

      {entryLocked && !testAccess ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-white/35 px-6 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/10 to-white/35" />

          <div className="relative z-10 -mt-8 text-center">
            <p className="text-xs font-semibold tracking-[0.34em] text-ink/45">PARTY GAME</p>
            <h2 className="mt-4 font-display text-5xl font-bold tracking-tight text-ink sm:text-6xl">
              COMING SOON…
            </h2>
            <p className="mt-5 text-lg font-semibold text-ink/70">活動尚未開始</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-ink/50">
              請先留在這個頁面，主持人開放後會自動解除。
            </p>

            <div className="mx-auto mt-6 flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/45 px-4 py-2 text-xs font-medium text-ink/55 shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-ember" />
              等待主持人開放
            </div>

            {testAccessEnabled ? (
              <button
                type="button"
                className="mt-5 text-xs font-semibold text-ink/40 underline underline-offset-4"
                onClick={() => {
                  setTestError('')
                  setTestPin('')
                  setShowTestLogin(true)
                }}
              >
                內部測試
              </button>
            ) : null}
          </div>

          <Link
            href="/admin"
            className="absolute bottom-7 right-5 z-10 text-xs font-medium text-ink/45 underline-offset-2 hover:underline"
          >
            管理員
          </Link>
        </div>
      ) : null}

      {showTestLogin ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-5">
          <div className="w-full max-w-sm rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="text-center">
              <p className="text-xs font-bold tracking-[0.18em] text-ember">INTERNAL TEST</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">輸入測試 PIN</h2>
              <p className="mt-2 text-sm text-soft">通過後只有這台裝置能進入測試，對外仍維持鎖定。</p>
            </div>

            <input
              autoFocus
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={testPin}
              onChange={(e) => setTestPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4 位數 PIN"
              className="field mt-5 text-center text-2xl tracking-[0.35em]"
            />

            {testError ? <p className="mt-3 text-center text-sm text-ember">{testError}</p> : null}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn-ghost"
                disabled={testBusy}
                onClick={() => setShowTestLogin(false)}
              >
                取消
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={testBusy || testPin.length !== 4}
                onClick={() => {
                  void (async () => {
                    setTestBusy(true)
                    setTestError('')
                    try {
                      const res = await api.testAccess(testPin)
                      setTestAccessToken(res.token)
                      const state = await api.state()
                      if (!state.testAccess) throw new Error('測試通行證驗證失敗')
                      setTestAccess(true)
                      setShowTestLogin(false)
                    } catch (e) {
                      clearTestAccessToken()
                      setTestError(e instanceof Error ? e.message : '測試登入失敗')
                    } finally {
                      setTestBusy(false)
                    }
                  })()
                }}
              >
                進入測試
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
