import type { ComponentType } from 'react'
import { CounterTool } from '../tools/counter/CounterTool'
import { FieldlifeLazy } from '../tools/fieldlife/FieldlifeLazy'
import { GoblinRaidTool } from '../tools/goblin-raid/GoblinRaidTool'
import { NotesTool } from '../tools/notes/NotesTool'

export type ToolStatus = 'ready' | 'draft'
export type ToolPresentation = 'embedded' | 'fullscreen'

export type ToolDefinition = {
  id: string
  name: string
  nameEn: string
  description: string
  status: ToolStatus
  tags: string[]
  presentation?: ToolPresentation
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
  {
    id: 'goblin-raid',
    name: '哥布林討伐',
    nameEn: 'Goblin Raid',
    description: '全螢幕霧林：配點、背包、三張地圖、遇敵練等。不存檔。',
    status: 'ready',
    tags: ['遊戲', '奇幻'],
    presentation: 'fullscreen',
    Component: GoblinRaidTool,
  },
  {
    id: 'fieldlife',
    name: 'Fieldlife 3D',
    nameEn: 'Fieldlife 3D',
    description: '3D 野原沙盒：AI 練功打怪升等，寫下自己的遊戲人生。私用訓練用。',
    status: 'ready',
    tags: ['遊戲', '3D', 'AI'],
    presentation: 'fullscreen',
    Component: FieldlifeLazy,
  },
]

export function getToolById(id: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.id === id)
}
