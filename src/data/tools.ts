import type { ComponentType } from 'react'
import { CounterTool } from '../tools/counter/CounterTool'
import { NotesTool } from '../tools/notes/NotesTool'

export type ToolStatus = 'ready' | 'draft'

export type ToolDefinition = {
  id: string
  name: string
  nameEn: string
  description: string
  status: ToolStatus
  tags: string[]
  Component: ComponentType
}

export const tools: ToolDefinition[] = [
  {
    id: 'counter',
    name: '計數器',
    nameEn: 'Counter',
    description: '一個最小的互動範例，用來示範工具怎麼掛進這裡。',
    status: 'ready',
    tags: ['demo', '基礎'],
    Component: CounterTool,
  },
  {
    id: 'notes',
    name: '隨手記',
    nameEn: 'Scratchpad',
    description: '本機暫存幾行想法，重整後還在。之後可再擴充成完整筆記。',
    status: 'ready',
    tags: ['demo', '文字'],
    Component: NotesTool,
  },
]

export function getToolById(id: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.id === id)
}
