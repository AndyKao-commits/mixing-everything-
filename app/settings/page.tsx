'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type StatusResponse = {
  capabilities: {
    openai: boolean
    instagramOAuth: boolean
    instagramMediaApi: boolean
    youtubeTranscript: boolean
    localTextParse: boolean
    videoUploadScan: boolean
  }
  instagram: {
    connected: boolean
    username?: string | null
    userId?: string
    expiresAt?: number
  }
}

export default function SettingsPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function refresh() {
    const res = await fetch('/api/recipe/status', { cache: 'no-store' })
    const data = (await res.json()) as StatusResponse
    setStatus(data)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ig = params.get('ig')
    if (ig === 'connected') setMessage('Instagram 已連線')
    if (ig === 'logged_out') setMessage('已登出 Instagram')
    if (ig === 'error') setError(params.get('message') || 'Instagram 登入失敗')
    refresh().catch((err) => setError(err instanceof Error ? err.message : '讀取狀態失敗'))
  }, [])

  async function logout() {
    await fetch('/api/auth/instagram/logout', { method: 'POST' })
    setMessage('已登出 Instagram')
    await refresh()
  }

  return (
    <div className="page">
      <header className="page__header">
        <h1>設定 / API</h1>
        <p>設定影片掃描能力：OpenAI、Instagram 登入、第三方媒體 API。</p>
      </header>

      {message ? <p className="banner banner--ok">{message}</p> : null}
      {error ? <p className="banner banner--err">{error}</p> : null}

      <section className="settings-card">
        <h2>能力狀態</h2>
        {!status ? (
          <p className="muted">讀取中…</p>
        ) : (
          <ul className="settings-list">
            <li>OpenAI 結構化／Whisper 掃描：{status.capabilities.openai ? '已啟用' : '未設定 OPENAI_API_KEY'}</li>
            <li>YouTube 字幕擷取：{status.capabilities.youtubeTranscript ? '可用' : '不可用'}</li>
            <li>本機文字解析後援：可用</li>
            <li>上傳影片掃描：{status.capabilities.videoUploadScan ? '可用' : '需 OpenAI'}</li>
            <li>Instagram OAuth：{status.capabilities.instagramOAuth ? '已設定 App' : '未設定 INSTAGRAM_APP_ID/SECRET'}</li>
            <li>第三方 IG Media API：{status.capabilities.instagramMediaApi ? '已設定' : '未設定'}</li>
          </ul>
        )}
      </section>

      <section className="settings-card">
        <h2>Instagram 登入</h2>
        <p className="muted">
          IG 會擋匿名抓取。官方 API 需登入後讀取<strong>你自己帳號</strong>的媒體；他人公開 Reel 可搭配說明文字、上傳影片，或第三方 Media API。
        </p>
        {status?.instagram.connected ? (
          <div className="settings-actions">
            <p>
              已登入：@{status.instagram.username || status.instagram.userId}
            </p>
            <button type="button" className="btn btn--ghost" onClick={logout}>
              登出 Instagram
            </button>
          </div>
        ) : (
          <div className="settings-actions">
            {status?.capabilities.instagramOAuth ? (
              <a className="btn btn--primary" href="/api/auth/instagram">
                登入 Instagram
              </a>
            ) : (
              <p className="muted">請先在伺服器環境變數設定 Instagram App，見 `.env.example`。</p>
            )}
          </div>
        )}
      </section>

      <section className="settings-card">
        <h2>環境變數</h2>
        <p className="muted">
          參考專案根目錄 <code>.env.example</code>。本地請建立 <code>.env.local</code>；Vercel 請到 Project Settings → Environment Variables。
        </p>
        <Link href="/about" className="back-link">
          查看使用說明 →
        </Link>
      </section>
    </div>
  )
}
