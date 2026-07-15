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
import { ACTION_LABELS, type ActionId, type TrainStats } from './types'
import './fieldlife.css'

const TICK_MS = 50

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

  const [mode, setMode] = useState<AgentMode>('grind')
  const [paused, setPaused] = useState(false)
  const [hud, setHud] = useState({
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
  })
  const [trainLog, setTrainLog] = useState<TrainStats[]>([])
  const [status, setStatus] = useState('AI 練功中：尋怪 → 攻擊 → 休息 → 升等')

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
          })
        }

        if (result.done) {
          const snap = sim.getSnapshot()
          setStatus(`這段人生結束（Lv.${snap.hero.level}｜擊殺 ${snap.hero.kills}）。重生中…`)
          sim.reset()
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
    setStatus('高速訓練 12 局中（無渲染）…')
    // yield so UI updates
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
          ? `訓練完成。最後一局 Lv.${last.level}／擊殺 ${last.kills}／探索 ${last.explored}`
          : '訓練完成',
      )
    }, 30)
  }

  const onResetLife = () => {
    simRef.current?.reset()
    setStatus('新的遊戲人生開始了。')
  }

  return (
    <div className="fieldlife">
      <div className="fieldlife__stage" ref={shellRef}>
        <canvas ref={canvasRef} className="fieldlife__canvas" />
        <div className="fieldlife__vignette" />
      </div>

      <header className="fieldlife__top">
        <Link to="/tools" className="fieldlife__back">
          ← 工具
        </Link>
        <div className="fieldlife__brand">
          <p className="fieldlife__eyebrow">私用 AI 沙盒</p>
          <h1>Fieldlife 3D</h1>
        </div>
        <p className="fieldlife__status">{status}</p>
      </header>

      <aside className="fieldlife__hud">
        <div className="fieldlife__stat">
          <span>人生 #{hud.episode}</span>
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
            style={{ width: `${(hud.xp / hud.xpToNext) * 100}%` }}
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
            <dt>倒下</dt>
            <dd>{hud.deaths}</dd>
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
        </dl>
        <p className="fieldlife__event">{hud.event}</p>
      </aside>

      <footer className="fieldlife__dock">
        <label className="fieldlife__mode">
          控制
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as AgentMode)}
          >
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
          下一段人生
        </button>
        <button type="button" className="fieldlife__primary" onClick={onBurstTrain}>
          高速訓練 ×12
        </button>
      </footer>

      {trainLog.length > 0 && (
        <section className="fieldlife__log" aria-label="訓練紀錄">
          <h2>訓練軌跡</h2>
          <ul>
            {trainLog.map((row) => (
              <li key={`${row.episode}-${row.steps}-${row.reward}`}>
                #{row.episode} · {row.steps}步 · R {row.reward} · Lv.{row.level} · 殺
                {row.kills} · 探{row.explored}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
