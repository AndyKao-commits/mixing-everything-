import type { CombatFxEvent, FloatingColor, FloatingText } from '@/types/game'
import { uid } from '@/utils/math'

export function spawnFloating(
  text: string,
  color: FloatingColor,
  x = 50 + Math.random() * 20,
  y = 40 + Math.random() * 20,
): FloatingText {
  return { id: uid('fx'), text, color, x, y, createdAt: performance.now() }
}

export function spawnFx(type: CombatFxEvent['type']): CombatFxEvent {
  return { id: uid('evt'), type, at: performance.now() }
}

export function pruneFloating(list: FloatingText[], now = performance.now()) {
  return list.filter((entry) => now - entry.createdAt < 900).slice(-24)
}

export function pruneFx(list: CombatFxEvent[], now = performance.now()) {
  return list.filter((entry) => now - entry.at < 700).slice(-12)
}
