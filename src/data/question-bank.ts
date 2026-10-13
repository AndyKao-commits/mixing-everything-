import { FOOD_PROMPTS, OBJECT_PROMPTS, PEOPLE_PROMPTS, MOMENT_PROMPTS, CREATIVE_PROMPTS, MYSTERY_PROMPTS } from './bingo'
import { SECRET_TASK_TEMPLATES, TARGET_TASKS, BOUNTY_TEMPLATES, DONT_COPY_PROMPTS, WHO_WROTE_PROMPTS } from './tasks'

export const QUESTION_GROUPS = [
  { id: 'food', label: '九宮格・食物', game: '九宮格' },
  { id: 'object', label: '九宮格・物品', game: '九宮格' },
  { id: 'people', label: '九宮格・人物', game: '九宮格' },
  { id: 'moment', label: '九宮格・瞬間', game: '九宮格' },
  { id: 'creative', label: '九宮格・創意', game: '九宮格' },
  { id: 'mystery', label: '九宮格・神秘任務', game: '九宮格' },
  { id: 'secret', label: '秘密任務', game: '秘密任務' },
  { id: 'target', label: '目標懸賞', game: '目標懸賞' },
  { id: 'bounty', label: '懸賞牆', game: '懸賞牆' },
  { id: 'dont_copy', label: '不要跟我一樣', game: '不要跟我一樣' },
  { id: 'who_wrote', label: '誰寫的', game: '誰寫的' },
] as const
export type QuestionCategory = (typeof QUESTION_GROUPS)[number]['id']
export type QuestionBankEntry = {
  id: string
  category: QuestionCategory
  text: string
  points?: number
  needsTarget?: boolean
  pool?: string
}

export function defaultQuestionBank(): QuestionBankEntry[] {
  const bingo = [...FOOD_PROMPTS, ...OBJECT_PROMPTS, ...PEOPLE_PROMPTS, ...MOMENT_PROMPTS, ...CREATIVE_PROMPTS, ...MYSTERY_PROMPTS]
    .map(p => ({ ...p }))
  return [
    ...bingo,
    ...SECRET_TASK_TEMPLATES.map((p, i) => ({...p, id: 'secret_' + i, category:'secret' as const})),
    ...TARGET_TASKS.map((p, i) => ({...p, id:'target_' + i, category:'target' as const})),
    ...BOUNTY_TEMPLATES.map((p, i) => ({...p, id:'bounty_' + i, category:'bounty' as const})),
    ...DONT_COPY_PROMPTS.map((text,i) => ({id:'dont_copy_' + i, category:'dont_copy' as const, text})),
    ...WHO_WROTE_PROMPTS.map((text,i) => ({id:'who_wrote_' + i, category:'who_wrote' as const, text})),
  ] as QuestionBankEntry[]
}
export const isQuestionCategory = (input: string): input is QuestionCategory =>
  QUESTION_GROUPS.some(g => g.id === input)
