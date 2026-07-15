/** Lightweight synthesized SFX — no asset pipeline required, fully functional. */

type SfxKind = 'attack' | 'critical' | 'boss' | 'victory' | 'upgrade' | 'button' | 'loot' | 'levelup' | 'hit'

let ctx: AudioContext | null = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function tone(freq: number, duration: number, type: OscillatorType = 'square', gain = 0.03) {
  const audio = getCtx()
  if (!audio) return
  const osc = audio.createOscillator()
  const g = audio.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = gain
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration)
  osc.connect(g)
  g.connect(audio.destination)
  osc.start()
  osc.stop(audio.currentTime + duration)
}

export function playSfx(kind: SfxKind, enabled = true) {
  if (!enabled) return
  switch (kind) {
    case 'attack':
      tone(180, 0.05, 'square', 0.02)
      break
    case 'hit':
      tone(140, 0.04, 'sawtooth', 0.018)
      break
    case 'critical':
      tone(420, 0.08, 'square', 0.03)
      tone(640, 0.1, 'triangle', 0.02)
      break
    case 'boss':
      tone(90, 0.2, 'sawtooth', 0.04)
      break
    case 'victory':
      tone(520, 0.1, 'triangle', 0.03)
      tone(780, 0.14, 'triangle', 0.025)
      break
    case 'upgrade':
      tone(300, 0.08, 'sine', 0.03)
      tone(450, 0.1, 'sine', 0.02)
      break
    case 'button':
      tone(240, 0.03, 'triangle', 0.015)
      break
    case 'loot':
      tone(660, 0.07, 'sine', 0.025)
      break
    case 'levelup':
      tone(400, 0.08, 'triangle', 0.03)
      tone(600, 0.1, 'triangle', 0.03)
      tone(800, 0.12, 'triangle', 0.03)
      break
  }
}

export function resumeAudio() {
  const audio = getCtx()
  if (audio?.state === 'suspended') void audio.resume()
}
