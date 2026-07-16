import type { ComponentType } from 'react'
import { CounterTool } from '@/tools/counter/CounterTool'
import { NotesTool } from '@/tools/notes/NotesTool'

export type ToolStatus = 'ready' | 'draft'

export type ToolDefinition = {
  id: string
  name: string
  nameEn: string
  description: string
  status: ToolStatus
  tags: string[]
  icon: 'counter' | 'notes' | 'folder'
  Component: ComponentType
}

export const tools: ToolDefinition[] = [
  {
    id: 'counter',
    name: '計數器',
    nameEn: 'Counter',
    description: '最小互動範例，示範工具如何掛進註冊表。',
    status: 'ready',
    tags: ['demo', '基礎'],
    icon: 'counter',
    Component: CounterTool,
  },
  {
    id: 'notes',
    name: '隨手記',
    nameEn: 'Scratchpad',
    description: '本機暫存幾行想法，重整後還在。之後可擴成完整筆記。',
    status: 'ready',
    tags: ['demo', '文字'],
    icon: 'notes',
    Component: NotesTool,
  },
]

export function getToolById(id: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.id === id)
}
