'use client'

import { useState } from 'react'

export function RoomCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const shareUrl =
    typeof window !== 'undefined' ? `${window.location.origin}/room/${code}` : `/room/${code}`

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // ignore
    }
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: '今晚玩什麼？',
          text: `房間 ${code}，快進來玩！`,
          url: shareUrl,
        })
        return
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm uppercase tracking-[0.25em] text-soft">房間</p>
      <p className="font-display text-5xl font-bold tracking-[0.2em] text-ink sm:text-6xl">{code}</p>
      <div className="flex justify-center gap-2">
        <button type="button" className="btn-secondary" onClick={copyCode}>
          {copied ? '已複製' : '複製房號'}
        </button>
        <button type="button" className="btn-secondary" onClick={share}>
          分享連結
        </button>
      </div>
    </div>
  )
}
