'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type StatusResponse = {
  capabilities: {
    openai: boolean
    youtubeTranscript: boolean
    localTextParse: boolean
    videoUploadScan: boolean
    publicVideoFetch: boolean
    othersRecipes: boolean
  }
}

export default function SettingsPage() {
  const [status, setStatus] = useState<StatusResponse | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/recipe/status', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => setStatus(data))
      .catch((err) => setError(err instanceof Error ? err.message : '讀取狀態失敗'))
  }, [])

  return (
    <div className="page">
      <header className="page__header">
        <h1>設定 / API</h1>
        <p>收入別人的食譜影片：自動抓公開內容，並整理材料／步驟。</p>
      </header>

      {error ? <p className="banner banner--err">{error}</p> : null}

      <section className="settings-card">
        <h2>能力狀態</h2>
        {!status ? (
          <p className="muted">讀取中…</p>
        ) : (
          <ul className="settings-list">
            <li>公開影片抓取（含他人 IG／YT／TikTok）：{status.capabilities.publicVideoFetch ? '可用' : '不可用'}</li>
            <li>OpenAI 語音掃描＋結構化：{status.capabilities.openai ? '已啟用' : '未設定 OPENAI_API_KEY'}</li>
            <li>YouTube 字幕：{status.capabilities.youtubeTranscript ? '可用' : '不可用'}</li>
            <li>上傳影片掃描：{status.capabilities.videoUploadScan ? '可用' : '需 OpenAI'}</li>
            <li>本機文字解析後援：可用</li>
          </ul>
        )}
      </section>

      <section className="settings-card">
        <h2>怎麼收入別人的食譜</h2>
        <ol className="steps">
          <li>在主頁貼上對方的公開影片連結</li>
          <li>按「掃描影片並整理」</li>
          <li>系統抓說明／音訊，整理材料與步驟後寫入日誌</li>
        </ol>
        <p className="muted" style={{ marginTop: '0.75rem' }}>
          建議設定 <code>OPENAI_API_KEY</code>：才能聽旁白內容，不只讀貼文說明。
        </p>
      </section>

      <section className="settings-card">
        <h2>環境變數</h2>
        <p className="muted">
          參考 <code>.env.example</code>。本地用 <code>.env.local</code>；部署到 Vercel 時加 Environment Variables。
        </p>
        <p className="muted">
          公開影片抓取依賴伺服器端 <code>yt-dlp</code>（透過 youtube-dl-exec）。較適合 Node 長時間執行環境；極短 serverless 可能逾時。
        </p>
        <Link href="/about" className="back-link">
          查看使用說明 →
        </Link>
      </section>
    </div>
  )
}
