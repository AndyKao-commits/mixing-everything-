import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
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

type PanelId = 'status' | 'chronicle' | 'train'

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

function isAiMode(mode: AgentMode): boolean {
  return mode !== 'human'
}

export function FieldlifeTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const simRef = useRef<FieldlifeSim | null>(null)
  const viewRef = useRef<FieldlifeView | null>(null)
  const linearRef = useRef(new LinearAgent(0.1))
  const modeRef = useRef<AgentMode>('human')
  const humanHeldRef = useRef<ActionId | null>(null)
  const humanQueueRef = useRef<ActionId[]>([])
  const trainBusyRef = useRef(false)
  const pausedRef = useRef(false)
  const closingRef = useRef(false)

  const [mode, setMode] = useState<AgentMode>('human')
  const [aiPolicy, setAiPolicy] = useState<'grind' | 'linear' | 'random'>('grind')
  const [paused, setPaused] = useState(false)
  const [hud, setHud] = useState<HudState>(initialHud)
  const [trainLog, setTrainLog] = useState<TrainStats[]>([])
  const [status, setStatus] = useState('點「合上序言」後，用下方按鈕操控旅人。')
  const [showLore, setShowLore] = useState(true)
  const [openPanels, setOpenPanels] = useState<Record<PanelId, boolean>>({
    status: false,
    chronicle: false,
    train: false,
  })

  const setPlayMode = (next: AgentMode) => {
    setMode(next)
    modeRef.current = next
    humanHeldRef.current = null
    humanQueueRef.current = []
    if (next === 'human') {
      setStatus('你接手這一世：前進／轉向／攻擊／休息。')
    } else {
      setStatus(`AI 接管（${next === 'grind' ? '練功' : next === 'linear' ? '學習' : '隨機'}）。`)
    }
  }

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

      acc += dt
      while (acc >= TICK_MS) {
        acc -= TICK_MS
        const obs = sim.observe()
        let action: ActionId = 0
        if (modeRef.current === 'human') {
          action = humanQueueRef.current.shift() ?? humanHeldRef.current ?? 0
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

        if (result.done && !closingRef.current) {
          closingRef.current = true
          const snap = sim.getSnapshot()
          const fate = snap.story.fateTitle ?? '普通餘燼'
          pullHud(action)
          setStatus(`閉卷：${snap.story.lifeName} →「${fate}」`)
          trainBusyRef.current = true
          window.setTimeout(() => {
            sim.reset()
            pullHud(0)
            closingRef.current = false
            trainBusyRef.current = false
            setStatus(modeRef.current === 'human' ? '新的一頁。繼續動手寫。' : '下一段人生，AI 續寫。')
          }, 1800)
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
    const onKeyDown = (e: KeyboardEvent) => {
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
      if (action === 1 || action === 2 || action === 3) {
        humanHeldRef.current = action
      } else {
        humanQueueRef.current.push(action)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (modeRef.current !== 'human') return
      if (['w', 'ArrowUp', 'a', 'ArrowLeft', 'd', 'ArrowRight'].includes(e.key)) {
        humanHeldRef.current = null
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  const togglePanel = (id: PanelId) => {
    setOpenPanels((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const pushHuman = (action: ActionId) => {
    if (mode !== 'human') setPlayMode('human')
    humanQueueRef.current.push(action)
  }

  const holdStart = (action: ActionId) => (e: ReactPointerEvent) => {
    e.preventDefault()
    if (mode !== 'human') setPlayMode('human')
    humanHeldRef.current = action
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const holdEnd = (e: ReactPointerEvent) => {
    e.preventDefault()
    humanHeldRef.current = null
  }

  const onBurstTrain = () => {
    const sim = simRef.current
    if (!sim || trainBusyRef.current) return
    trainBusyRef.current = true
    closingRef.current = false
    setStatus('高速訓練十二世…')
    window.setTimeout(() => {
      const logs = burstTrain(sim, linearRef.current, 12)
      setTrainLog((prev) => [...logs, ...prev].slice(0, 24))
      setAiPolicy('linear')
      setPlayMode('linear')
      sim.reset()
      trainBusyRef.current = false
      setOpenPanels((p) => ({ ...p, train: true }))
      const last = logs[logs.length - 1]
      setStatus(
        last
          ? `訓練完。末世「${last.fateTitle ?? last.chapterTitle}」Lv.${last.level}`
          : '訓練完成',
      )
    }, 30)
  }

  const onResetLife = () => {
    const sim = simRef.current
    if (!sim) return
    closingRef.current = false
    trainBusyRef.current = false
    humanHeldRef.current = null
    sim.reset()
    setStatus('這一頁合上，下一頁張開。')
  }

  const startPlaying = () => {
    setShowLore(false)
    setPlayMode('human')
  }

  const hpPct = (hud.hp / Math.max(1, hud.maxHp)) * 100
  const xpPct = (hud.xp / Math.max(1, hud.xpToNext)) * 100

  return (
    <div className="fieldlife" style={{ ['--fl-accent' as string]: hud.accent }}>
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
        </div>
        <div className="fieldlife__who">
          <button
            type="button"
            className={mode === 'human' ? 'is-active' : undefined}
            onClick={() => setPlayMode('human')}
          >
            我來玩
          </button>
          <button
            type="button"
            className={isAiMode(mode) ? 'is-active' : undefined}
            onClick={() => setPlayMode(aiPolicy)}
          >
            AI 練功
          </button>
        </div>
      </header>

      <div className="fieldlife__strip" aria-live="polite">
        <div className="fieldlife__strip-main">
          <strong>{hud.lifeName}</strong>
          <span>
            {hud.chapterTitle} · Lv.{hud.level} · #{hud.episode}
          </span>
        </div>
        <div className="fieldlife__strip-bars">
          <div className="fieldlife__mini-bar" title="HP">
            <i style={{ width: `${hpPct}%` }} className="is-hp" />
          </div>
          <div className="fieldlife__mini-bar" title="XP">
            <i style={{ width: `${xpPct}%` }} className="is-xp" />
          </div>
        </div>
        <p className="fieldlife__strip-event">{hud.event}</p>
      </div>

      <div className="fieldlife__rail fieldlife__rail--left">
        <details className="fieldlife__panel" open={openPanels.status}>
          <summary
            onClick={(e) => {
              e.preventDefault()
              togglePanel('status')
            }}
          >
            狀態 <span>{openPanels.status ? '收合' : '展開'}</span>
          </summary>
          {openPanels.status && (
            <div className="fieldlife__panel-body">
              <div className="fieldlife__chapter">
                <span>篇章 {hud.chapterIndex + 1}/10</span>
                <strong>{hud.chapterTitle}</strong>
                <em>{hud.chapterSubtitle}</em>
              </div>
              <p className="fieldlife__event">{status}</p>
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
              <div className="fieldlife__bar">
                <div className="fieldlife__bar-fill fieldlife__bar-fill--hp" style={{ width: `${hpPct}%` }} />
                <span>
                  HP {hud.hp}/{hud.maxHp}
                </span>
              </div>
              <div className="fieldlife__bar">
                <div className="fieldlife__bar-fill fieldlife__bar-fill--xp" style={{ width: `${xpPct}%` }} />
                <span>
                  XP {hud.xp}/{hud.xpToNext}
                </span>
              </div>
              {hud.fateTitle && (
                <div className="fieldlife__fate">
                  <strong>{hud.fateTitle}</strong>
                  <p>{hud.fateEpitaph}</p>
                </div>
              )}
            </div>
          )}
        </details>
      </div>

      <div className="fieldlife__rail fieldlife__rail--right">
        <details className="fieldlife__panel" open={openPanels.chronicle}>
          <summary
            onClick={(e) => {
              e.preventDefault()
              togglePanel('chronicle')
            }}
          >
            編年 ({hud.chronicle.length}) <span>{openPanels.chronicle ? '收合' : '展開'}</span>
          </summary>
          {openPanels.chronicle && (
            <div className="fieldlife__panel-body fieldlife__panel-body--scroll">
              <ul className="fieldlife__list">
                {hud.chronicle.map((row, i) => (
                  <li key={`${row.tick}-${i}-${row.text.slice(0, 10)}`} data-kind={row.kind}>
                    {row.text}
                  </li>
                ))}
              </ul>
              {hud.memories.length > 0 && (
                <>
                  <h3>記憶碎片</h3>
                  <ul className="fieldlife__list fieldlife__list--memory">
                    {hud.memories.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </details>

        {trainLog.length > 0 && (
          <details className="fieldlife__panel" open={openPanels.train}>
            <summary
              onClick={(e) => {
                e.preventDefault()
                togglePanel('train')
              }}
            >
              十二世速寫 <span>{openPanels.train ? '收合' : '展開'}</span>
            </summary>
            {openPanels.train && (
              <div className="fieldlife__panel-body fieldlife__panel-body--scroll">
                <ul className="fieldlife__list">
                  {trainLog.map((row) => (
                    <li key={`${row.episode}-${row.steps}-${row.reward}`}>
                      {row.lifeName ?? `#${row.episode}`} · {row.fateTitle ?? row.chapterTitle} · Lv.
                      {row.level}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </details>
        )}
      </div>

      {mode === 'human' && !showLore && (
        <div className="fieldlife__pad" aria-label="觸控操作">
          <div className="fieldlife__pad-move">
            <button
              type="button"
              className="fieldlife__pad-btn"
              onPointerDown={holdStart(2)}
              onPointerUp={holdEnd}
              onPointerCancel={holdEnd}
            >
              左轉
            </button>
            <button
              type="button"
              className="fieldlife__pad-btn fieldlife__pad-btn--main"
              onPointerDown={holdStart(1)}
              onPointerUp={holdEnd}
              onPointerCancel={holdEnd}
            >
              前進
            </button>
            <button
              type="button"
              className="fieldlife__pad-btn"
              onPointerDown={holdStart(3)}
              onPointerUp={holdEnd}
              onPointerCancel={holdEnd}
            >
              右轉
            </button>
          </div>
          <div className="fieldlife__pad-act">
            <button type="button" className="fieldlife__pad-btn fieldlife__pad-btn--hit" onClick={() => pushHuman(4)}>
              攻擊
            </button>
            <button type="button" className="fieldlife__pad-btn" onClick={() => pushHuman(5)}>
              休息
            </button>
          </div>
        </div>
      )}

      {showLore && (
        <div className="fieldlife__lore" role="dialog" aria-modal="true">
          <p className="fieldlife__eyebrow">{WORLD_LORE.title}</p>
          <h2>這片野原由誰書寫？</h2>
          <p>{WORLD_LORE.premise}</p>
          <p>{WORLD_LORE.rule}</p>
          <p className="fieldlife__lore-hint">
            你可以自己玩，也可以讓 AI NPC 練功升等、解鎖篇章；資料欄位都能收合，不要擋畫面。
          </p>
          <div className="fieldlife__lore-actions">
            <button type="button" className="fieldlife__primary" onClick={startPlaying}>
              開始遊玩
            </button>
            <button
              type="button"
              onClick={() => {
                setShowLore(false)
                setPlayMode(aiPolicy)
              }}
            >
              看 AI 練功
            </button>
          </div>
        </div>
      )}

      <footer className="fieldlife__dock">
        {isAiMode(mode) && (
          <label className="fieldlife__mode">
            AI 策略
            <select
              value={aiPolicy}
              onChange={(e) => {
                const v = e.target.value as 'grind' | 'linear' | 'random'
                setAiPolicy(v)
                setPlayMode(v)
              }}
            >
              <option value="grind">練功策略</option>
              <option value="linear">線性學習</option>
              <option value="random">隨機</option>
            </select>
          </label>
        )}
        <button type="button" onClick={() => setPaused((p) => !p)}>
          {paused ? '繼續' : '暫停'}
        </button>
        <button type="button" onClick={onResetLife}>
          下一世
        </button>
        <button type="button" className="fieldlife__primary" onClick={onBurstTrain}>
          訓練 ×12
        </button>
        <button type="button" onClick={() => setShowLore(true)}>
          序言
        </button>
      </footer>
    </div>
  )
}
