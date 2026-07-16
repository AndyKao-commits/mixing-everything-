'use client'

import { use } from 'react'
import Link from 'next/link'
import { getToolById } from '@/data/tools'

export default function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const tool = getToolById(id)

  if (!tool) {
    return (
      <div className="page">
        <Link href="/tools" className="back-link">
          ← 工具列表
        </Link>
        <h1>找不到工具</h1>
        <p className="muted">id: {id}</p>
      </div>
    )
  }

  const Component = tool.Component
  return <Component />
}
