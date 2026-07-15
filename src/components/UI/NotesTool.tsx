'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PrimaryButton } from '@/components/UI/Primitives'

const KEY = 'mixing-notes-v1'

export function NotesTool() {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setText(window.localStorage.getItem(KEY) ?? '')
  }, [])

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col gap-4 bg-raid-bg px-6 py-10 text-raid-ink">
      <Link href="/tools" className="text-sm text-raid-muted">← 工具列表</Link>
      <h1 className="text-3xl font-bold">隨手記</h1>
      <textarea
        className="min-h-64 w-full rounded-xl border-white/10 bg-raid-panel p-3"
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setSaved(false)
        }}
      />
      <PrimaryButton
        onClick={() => {
          window.localStorage.setItem(KEY, text)
          setSaved(true)
        }}
      >
        {saved ? '已儲存' : '儲存到本機'}
      </PrimaryButton>
    </main>
  )
}
