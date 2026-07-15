'use client'

import { use } from 'react'
import { GoblinRaidRemastered } from '@/game/GoblinRaidRemastered'
import { CounterTool } from '@/components/UI/CounterTool'
import { NotesTool } from '@/components/UI/NotesTool'

export default function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  switch (id) {
    case 'goblin-raid':
      return <GoblinRaidRemastered />
    case 'counter':
      return <CounterTool />
    case 'notes':
      return <NotesTool />
    default:
      return (
        <main className="mx-auto max-w-lg px-6 py-16 text-raid-ink">
          <h1 className="text-2xl font-bold">找不到工具</h1>
          <p className="mt-2 text-raid-muted">id: {id}</p>
        </main>
      )
  }
}
