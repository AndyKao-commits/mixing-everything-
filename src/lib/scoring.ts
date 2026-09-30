import type { BingoCard, ScoreTransaction } from '@/types'

const LINES = [
  ['r0', [0, 1, 2]],
  ['r1', [3, 4, 5]],
  ['r2', [6, 7, 8]],
  ['c0', [0, 3, 6]],
  ['c1', [1, 4, 7]],
  ['c2', [2, 5, 8]],
  ['d0', [0, 4, 8]],
  ['d1', [2, 4, 6]],
] as const

export function totalScore(txs: ScoreTransaction[], playerId: string): number {
  return txs
    .filter((t) => t.player_id === playerId)
    .reduce((sum, t) => sum + t.points, 0)
}

export function scoreBreakdown(txs: ScoreTransaction[], playerId: string) {
  const mine = txs.filter((t) => t.player_id === playerId)
  const groups: Record<string, number> = {}
  for (const t of mine) {
    groups[t.source_type] = (groups[t.source_type] || 0) + t.points
  }
  return groups
}

export function computeBingoBonuses(card: BingoCard): {
  newLines: string[]
  fullBonus: boolean
} {
  const done = new Set(card.cells.filter((c) => c.completed).map((c) => c.index))
  const newLines: string[] = []
  for (const [key, idxs] of LINES) {
    if (card.line_bonuses.includes(key)) continue
    if (idxs.every((i) => done.has(i))) newLines.push(key)
  }
  const fullBonus = !card.full_bonus && done.size === 9
  return { newLines, fullBonus }
}

export function SOURCE_LABEL(source: string): string {
  const map: Record<string, string> = {
    bingo: '九宮格',
    secret_task: '秘密任務',
    bounty: '懸賞',
    target: '懸賞某人',
    group_game: '不要跟我一樣',
    who_wrote_it: '誰寫的',
    final_button: '最後按鈕',
    admin_adjustment: '管理員調整',
  }
  return map[source] || source
}
