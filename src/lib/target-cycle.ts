/** Create a derangement cycle: each player targets exactly one other, forming cycles. */
export function buildTargetCycle(playerIds: string[]): Array<[string, string]> {
  if (playerIds.length < 2) return []
  const shuffled = [...playerIds]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  const pairs: Array<[string, string]> = []
  for (let i = 0; i < shuffled.length; i += 1) {
    const from = shuffled[i]
    const to = shuffled[(i + 1) % shuffled.length]
    pairs.push([from, to])
  }
  return pairs
}
