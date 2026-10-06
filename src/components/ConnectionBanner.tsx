'use client'

import { useEffect, useState } from 'react'

export function ConnectionBanner() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed inset-x-3 top-3 z-[100] rounded-2xl bg-ink px-4 py-3 text-center text-sm font-semibold text-white shadow-card">
      網路已中斷。請保留這個畫面，連線恢復後再繼續操作。
    </div>
  )
}
