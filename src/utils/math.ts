export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`
}

export function chance(p: number) {
  return Math.random() < p
}

export function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]!
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  return Math.floor(n).toLocaleString('en-US')
}

export function expToNext(level: number) {
  return Math.floor(40 + level * 28 + level * level * 3.2)
}

export function goldCurve(base: number, wave: number, mapDifficulty: number) {
  return Math.floor(base * (1 + wave * 0.08) * mapDifficulty)
}

export function expCurve(base: number, wave: number, mapDifficulty: number) {
  return Math.floor(base * (1 + wave * 0.07) * Math.pow(mapDifficulty, 0.9))
}

export function enemyScale(wave: number, mapDifficulty: number) {
  return Math.pow(1.055, wave) * mapDifficulty
}

export function bossScale(wave: number, mapDifficulty: number) {
  return enemyScale(wave, mapDifficulty) * (1.8 + Math.floor(wave / 10) * 0.15)
}
