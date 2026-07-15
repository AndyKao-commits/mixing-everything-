'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PrimaryButton, GhostButton } from '@/components/UI/Primitives'

export function CounterTool() {
  const [n, setN] = useState(0)
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col gap-4 bg-raid-bg px-6 py-10 text-raid-ink">
      <Link href="/tools" className="text-sm text-raid-muted">← 工具列表</Link>
      <h1 className="text-3xl font-bold">計數器</h1>
      <p className="text-5xl font-display">{n}</p>
      <div className="flex gap-2">
        <PrimaryButton onClick={() => setN((v) => v + 1)}>+1</PrimaryButton>
        <GhostButton onClick={() => setN(0)}>歸零</GhostButton>
      </div>
    </main>
  )
}
