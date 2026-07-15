import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  burstTrain,
  LinearAgent,
  pickAction,
  type AgentMode,
} from './agent'
import { createFieldlifeView, type FieldlifeView } from './render3d'
import { FieldlifeSim } from './sim'
import { WORLD_LORE } from './story'
import { ACTION_LABELS, type ActionId, type TrainStats } from './types'
import './fieldlife.css'

const TICK_MS = 50

type HudState = {
  episode: number
  level: number
  hp: number
  maxHp: number
  xp: number
  xpToNext: number
  kills: number
  deaths: number
  explored: number
  stepsAlive: number
  reward: number
  event: string
  action: string
  lifeName: string
  chapterTitle: string
  chapterSubtitle: string
  chapterIndex: number
  chronicle: { tick: number; kind: string; text: string }[]
  memories: string[]
  fateTitle: string | null
  fateEpitaph: string | null
  accent: string
}

const initialHud: HudState = {
  episode: 1,
  level: 1,
  hp: 40,
  maxHp: 40,
  xp: 0,
  xpToNext: 40,
  kills: 0,
  deaths: 0,
  explored: 1,
  stepsAlive: 0,
  reward: 0,
  event: '野原甦醒了。',
  action: '待機',
  lifeName: '餘灰・無名',
  chapterTitle: '初落',
  chapterSubtitle: '落灰的第一口氣',
  chapterIndex: 0,
  chronicle: [],
  memories: [],
  fateTitle: null,
  fateEpitaph: null,
  accent: '#d4a14a',
}

function hexAccent(n: number): string {
  return `#${n.toString(16).padStart(6, '0')}`
}

export function FieldlifeTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const simRef = useRef<FieldlifeSim | null>(null)
  const viewRef = useRef<FieldlifeView | null>(null)
  const linearRef = useRef(new LinearAgent(0.1))
  const modeRef = useRef<AgentMode>('grind')
  const humanQueueRef = useRef<ActionId[]>([])
  const runningRef = useRef(true)
  const trainBusyRef = useRef(false)
  const pausedRef = useRef(false)
  const closingRef = useRef(false)

  const [mode, setMode] = useState<AgentMode>('grind')
  const [paused, setPaused] = useState(false)
  const [hud, setHud] = useState<HudState>(initialHud)
  const [trainLog, setTrainLog] = useState<TrainStats[]>([])
  const [status, setStatus] = useState(WORLD_LORE.premise)
  const [showLore, setShowLore] = useState(true)

  useEffect(() => {
    modeRef.current = mode
  }, [mode])

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    const shell = shellRef.current
    if (!canvas || !shell) return

    const sim = new FieldlifeSim()
    simRef.current = sim
    const view = createFieldlifeView(canvas)
    viewRef.current = view

    const resize = () => {
      const rect = shell.getBoundingClientRect()
      view.resize(rect.width, rect.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(shell)

    let last = performance.now()
    let acc = 0
    let raf = 0
    let hudThrottle = 0

    const pullHud = (action: ActionId) => {
      const snap = sim.getSnapshot()
      setHud({
        episode: snap.episode,
        level: snap.hero.level,
        hp: Math.max(0, Math.round(snap.hero.hp)),
        maxHp: snap.hero.maxHp,
        xp: snap.hero.xp,
        xpToNext: snap.hero.xpToNext,
        kills: snap.hero.kills,
        deaths: snap.hero.deaths,
        explored: snap.hero.explored,
        stepsAlive: snap.hero.stepsAlive,
        reward: Math.round(snap.totalReward * 10) / 10,
        event: snap.lastEvent,
        action: ACTION_LABELS[action],
        lifeName: snap.story.lifeName,
        chapterTitle: snap.story.chapterTitle,
        chapterSubtitle: snap.story.chapterSubtitle,
        chapterIndex: snap.story.chapterIndex,
        chronicle: snap.story.chronicle.slice(0, 10),
        memories: snap.story.memories.slice(0, 6),
        fateTitle: snap.story.fateTitle,
        fateEpitaph: snap.story.fateEpitaph,
        accent: hexAccent(snap.story.atmosphere.accent),
      })
    }

    pullHud(0)

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = now - last
      last = now
      if (pausedRef.current || trainBusyRef.current) {
        view.sync(sim.getSnapshot())
        return
      }
      if (!runningRef.current) return

      acc += dt
      while (acc >= TICK_MS) {
        acc -= TICK_MS
        const obs = sim.observe()
        let action: ActionId = 0
        if (modeRef.current === 'human') {
          action = humanQueueRef.current.shift() ?? 0
        } else {
          action = pickAction(modeRef.current, obs, linearRef.current)
        }

        const result = sim.step(action)
        if (modeRef.current === 'linear') {
          linearRef.current.learn(result.reward)
        }

        hudThrottle += 1
        if (hudThrottle % 4 === 0 || result.done) {
          pullHud(action)
        }

        if (result.done) {
          if (!closingRef.current) {
            closingRef.current = true
            const snap = sim.getSnapshot()
            const fate = snap.story.fateTitle ?? '普通餘燼'
            pullHud(action)
            setStatus(`閉卷：${snap.story.lifeName} →「${fate}」。灰燼翻頁中…`)
            trainBusyRef.current = true
            window.setTimeout(() => {
              sim.reset()
              pullHud(0)
              closingRef.current = false
              trainBusyRef.current = false
              setStatus('下一段人生從紙縫站起。')
            }, 2200)
          }
        }
      }
      view.sync(sim.getSnapshot())
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      view.dispose()
      viewRef.current = null
      simRef.current = null
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (modeRef.current !== 'human') return
      const map: Record<string, ActionId> = {
        w: 1,
        ArrowUp: 1,
        a: 2,
        ArrowLeft: 2,
        d: 3,
        ArrowRight: 3,
        j: 4,
        ' ': 4,
        k: 5,
        r: 5,
      }
      const action = map[e.key]
      if (action === undefined) return
      e.preventDefault()
      humanQueueRef.current.push(action)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const onBurstTrain = () => {
    const sim = simRef.current
    if (!sim || trainBusyRef.current) return
    trainBusyRef.current = true
    closingRef.current = false
    setStatus('女神快速翻過十二段人生（無渲染訓練）…')
    window.setTimeout(() => {
      const logs = burstTrain(sim, linearRef.current, 12)
      setTrainLog((prev) => [...logs, ...prev].slice(0, 24))
      setMode('linear')
      modeRef.current = 'linear'
      sim.reset()
      trainBusyRef.current = false
      const last = logs[logs.length - 1]
      setStatus(
        last
          ? `訓練收束。末世 ${last.lifeName ?? ''}「${last.fateTitle ?? last.chapterTitle}」Lv.${last.level}`
          : '訓練完成',
      )
    }, 30)
  }

  const onResetLife = () => {
    const sim = simRef.current
    if (!sim) return
    closingRef.current = false
    trainBusyRef.current = false
    sim.reset()
    setStatus('你親手合上這一頁，再掀開下一頁。')
  }

  return (
    <div
      className="fieldlife"
      style={{ ['--fl-accent' as string]: hud.accent }}
    >
      <div className="fieldlife__stage" ref={shellRef}>
        <canvas ref={canvasRef} className="fieldlife__canvas" />
        <div className="fieldlife__vignette" />
      </div>

      <header className="fieldlife__top">
        <Link to="/tools" className="fieldlife__back">
          ← 工具
        </Link>
        <div className="fieldlife__brand">
          <p className="fieldlife__eyebrow">{WORLD_LORE.titleEn}</p>
          <h1>{WORLD_LORE.title}</h1>
          <p className="fieldlife__life">{hud.lifeName}</p>
        </div>
        <p className="fieldlife__status">{status}</p>
      </header>

      <aside className="fieldlife__hud">
        <div className="fieldlife__chapter">
          <span>
            篇章 {hud.chapterIndex + 1}/10 · 人生 #{hud.episode}
          </span>
          <strong>{hud.chapterTitle}</strong>
          <em>{hud.chapterSubtitle}</em>
        </div>
        <div className="fieldlife__stat">
          <span>等級</span>
          <strong>Lv.{hud.level}</strong>
        </div>
        <div className="fieldlife__bar">
          <div
            className="fieldlife__bar-fill fieldlife__bar-fill--hp"
            style={{ width: `${(hud.hp / hud.maxHp) * 100}%` }}
          />
          <span>
            HP {hud.hp}/{hud.maxHp}
          </span>
        </div>
        <div className="fieldlife__bar">
          <div
            className="fieldlife__bar-fill fieldlife__bar-fill--xp"
            style={{ width: `${(hud.xp / Math.max(1, hud.xpToNext)) * 100}%` }}
          />
          <span>
            XP {hud.xp}/{hud.xpToNext}
          </span>
        </div>
        <dl className="fieldlife__meta">
          <div>
            <dt>擊殺</dt>
            <dd>{hud.kills}</dd>
          </div>
          <div>
            <dt>探索</dt>
            <dd>{hud.explored}</dd>
          </div>
          <div>
            <dt>步數</dt>
            <dd>{hud.stepsAlive}</dd>
          </div>
          <div>
            <dt>獎勵</dt>
            <dd>{hud.reward}</dd>
          </div>
          <div>
            <dt>動作</dt>
            <dd>{hud.action}</dd>
          </div>
          <div>
            <dt>倒下</dt>
            <dd>{hud.deaths}</dd>
          </div>
        </dl>
        <p className="fieldlife__event">{hud.event}</p>
        {hud.fateTitle && (
          <div className="fieldlife__fate">
            <strong>{hud.fateTitle}</strong>
            <p>{hud.fateEpitaph}</p>
          </div>
        )}
      </aside>

      <section className="fieldlife__chronicle" aria-label="編年史">
        <h2>編年</h2>
        <ul>
          {hud.chronicle.map((row, i) => (
            <li key={`${row.tick}-${i}-${row.text.slice(0, 12)}`} data-kind={row.kind}>
              {row.text}
            </li>
          ))}
        </ul>
        {hud.memories.length > 0 && (
          <>
            <h2>記憶碎片</h2>
            <ul className="fieldlife__memories">
              {hud.memories.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {showLore && (
        <div className="fieldlife__lore">
          <button type="button" className="fieldlife__lore-close" onClick={() => setShowLore(false)}>
            合上序言
          </button>
          <p className="fieldlife__eyebrow">{WORLD_LORE.title}</p>
          <h2>這片野原由誰書寫？</h2>
          <p>{WORLD_LORE.premise}</p>
          <p>{WORLD_LORE.rule}</p>
          <p className="fieldlife__lore-hint">
            AI 會自己練功、升等、解鎖篇章；倒下時野原判定稱號，再開啟下一段人生。
          </p>
        </div>
      )}

      <footer className="fieldlife__dock">
        <label className="fieldlife__mode">
          控制
          <select value={mode} onChange={(e) => setMode(e.target.value as AgentMode)}>
            <option value="grind">AI 練功策略</option>
            <option value="linear">線性強化學習</option>
            <option value="random">隨機基準</option>
            <option value="human">手動（WASD / J 攻 / K 休）</option>
          </select>
        </label>
        <button type="button" onClick={() => setPaused((p) => !p)}>
          {paused ? '繼續' : '暫停'}
        </button>
        <button type="button" onClick={onResetLife}>
          強制閉卷
        </button>
        <button type="button" className="fieldlife__primary" onClick={onBurstTrain}>
          高速翻頁 ×12
        </button>
        <button type="button" onClick={() => setShowLore(true)}>
          序言
        </button>
      </footer>

      {trainLog.length > 0 && (
        <section className="fieldlife__log" aria-label="訓練紀錄">
          <h2>十二世速寫</h2>
          <ul>
            {trainLog.map((row) => (
              <li key={`${row.episode}-${row.steps}-${row.reward}`}>
                {row.lifeName ?? `#${row.episode}`} · {row.fateTitle ?? row.chapterTitle} · Lv.
                {row.level} · 殺{row.kills} · 探{row.explored}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
