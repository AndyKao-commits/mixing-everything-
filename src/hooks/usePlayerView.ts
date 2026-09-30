'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { clearPlayerSession, getPlayerToken } from '@/lib/client-session'

export function usePlayerView(pollMs = 2000) {
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
      if (/未登入|重新登入|PIN/.test(message)) {
        clearPlayerSession()
        router.replace('/join')
      }
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    void refresh()
    const id = window.setInterval(() => void refresh(), pollMs)
    return () => window.clearInterval(id)
  }, [refresh, pollMs])

  return { data, error, loading, refresh, setData }
}
