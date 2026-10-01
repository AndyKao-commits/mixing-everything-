'use client'

import { useCallback, useContext, useEffect, useState } from 'react'
import { PlayerViewContext } from './player-view-context'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { clearPlayerSession, getPlayerToken } from '@/lib/client-session'

function usePlayerViewSource(pollMs = 2000) {
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getPlayerToken()
    if (!token) {
      router.replace('/join')
      return
    }
    try {
      const view = await api.me(token)
      setData(view)
      setError('')
    } catch (e) {
      const message = e instanceof Error ? e.message : '暫時無法更新'
      setError(message)
      if (/未登入|重新登入|PIN|玩家不存在/.test(message)) {
        clearPlayerSession()
        router.replace('/join')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void refresh()
    let timer: number | undefined
    let stopped = false

    const schedule = () => {
      if (stopped) return
      timer = window.setTimeout(async () => {
        if (document.visibilityState === 'visible') await refresh()
        schedule()
      }, pollMs + Math.floor(Math.random() * Math.min(600, Math.max(100, pollMs * 0.2))))
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') void refresh()
    }

    schedule()
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stopped = true
      if (timer) window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refresh, pollMs])

  return { data, error, loading, refresh, setData }
}

export function usePlayerView(pollMs = 2000) {
  const shared = useContext(PlayerViewContext)
  const local = usePlayerViewSource(shared ? 60_000 : pollMs)
  return shared || local
}
