import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from 'react'
import { Link } from 'react-router-dom'
import {
  applyXp,
  createPlayer,
  fleeChance,
  healPlayer,
  monsterStrike,
  playerStrike,
  roll,
  rollLoot,
} from './combat'
import { loadMonsterRoster, pickMonster } from './monsters'
import { COLS, HEIGHT, paintWorld, ROWS, WIDTH } from './render'
import type { Dir, DropItem, GamePhase, MonsterData, PlayerStats, Vec } from './types'
import './goblin-raid.css'

const MAP: number[][] = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 2, 2, 2, 0, 0, 3, 3, 0, 0, 0, 4, 1],
  [1, 0, 1, 2, 0, 2, 0, 1, 3, 0, 0, 1, 0, 0, 1],
  [1, 0, 0, 2, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 1],
  [1, 3, 3, 2, 0, 0, 0, 1, 0, 2, 2, 2, 1, 0, 1],
  [1, 3, 0, 2, 2, 2, 0, 0, 0, 2, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 2, 1, 1, 0, 2, 0, 3, 3, 0, 1],
  [1, 0, 1, 0, 0, 2, 2, 2, 2, 2, 0, 3, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 0, 0, 0, 2, 2, 2, 0, 0, 1],
  [1, 4, 0, 0, 0, 0, 3, 3, 0, 0, 0, 2, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
]

const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

type CombatState = {
  monster: MonsterData
  monsterHp: number
  log: string[]
  busy: boolean
}

type LootState = {
  xp: number
  leveled: boolean
  drops: DropItem[]
  summary: string[]
}

function canWalk(x: number, y: number): boolean {
  if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return false
  return MAP[y]![x] !== 1
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

export function GoblinRaidTool() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const holdDirRef = useRef<Dir | null>(null)
  const lastMoveRef = useRef(0)
  const posRef = useRef<Vec>({ x: 3, y: 5 })
  const facingRef = useRef<Dir>('down')
  const stepCountRef = useRef(0)
  const phaseRef = useRef<GamePhase>('boot')
  const combatRef = useRef<CombatState | null>(null)
  const playerRef = useRef<PlayerStats>(createPlayer())
  const rosterRef = useRef<MonsterData[]>([])
  const attackHandlerRef = useRef<() => void>(() => {})
  const continueHandlerRef = useRef<() => void>(() => {})

  const [phase, setPhase] = useState<GamePhase>('boot')
  const [player, setPlayer] = useState<PlayerStats>(() => createPlayer())
  const [roster, setRoster] = useState<MonsterData[]>([])
  const [source, setSource] = useState<'api' | 'fallback'>('fallback')
  const [message, setMessage] = useState('霧在林間流動……')
  const [combat, setCombat] = useState<CombatState | null>(null)
  const [loot, setLoot] = useState<LootState | null>(null)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  useEffect(() => {
    combatRef.current = combat
  }, [combat])
  useEffect(() => {
    playerRef.current = player
  }, [player])
  useEffect(() => {
    rosterRef.current = roster
  }, [roster])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const startExplore = useCallback((freshPlayer?: PlayerStats) => {
    posRef.current = { x: 3, y: 5 }
    facingRef.current = 'down'
    stepCountRef.current = 0
    setCombat(null)
    setLoot(null)
    if (freshPlayer) {
      setPlayer(freshPlayer)
      playerRef.current = freshPlayer
    }
    setPhase('explore')
    setMessage('往紫霧走，尋找哥布林。')
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const loaded = await loadMonsterRoster()
      if (cancelled) return
      setRoster(loaded.monsters)
      rosterRef.current = loaded.monsters
      setSource(loaded.source)
      startExplore(createPlayer())
    })()
    return () => {
      cancelled = true
    }
  }, [startExplore])

  const appendLog = useCallback((line: string) => {
    setCombat((current) => {
      if (!current) return current
      return { ...current, log: [line, ...current.log].slice(0, 4) }
    })
  }, [])

  const triggerEncounter = useCallback(() => {
    const list = rosterRef.current
    if (list.length === 0) return
    const monster = pickMonster(list, playerRef.current.level)
    const next: CombatState = {
      monster,
      monsterHp: monster.hp,
      log: [`${monster.nameZh}從霧裡撲出！`],
      busy: false,
    }
    setCombat(next)
    combatRef.current = next
    setPhase('combat')
    setMessage('點「攻擊」，或按空白鍵')
  }, [])

  const tryMove = useCallback(
    (dir: Dir) => {
      if (phaseRef.current !== 'explore') return
      const delta = DIRS[dir]
      const next = { x: posRef.current.x + delta.x, y: posRef.current.y + delta.y }
      facingRef.current = dir
      if (!canWalk(next.x, next.y)) return
      posRef.current = next
      stepCountRef.current += 1

      const tile = MAP[next.y]![next.x]
      if (tile === 4) {
        setPlayer((current) => {
          const healed = {
            ...current,
            hp: Math.min(current.maxHp, current.hp + 4 + Math.floor(current.vitality / 3)),
          }
          playerRef.current = healed
          return healed
        })
        setMessage('篝火溫暖了你。')
        return
      }
      if (tile === 3) {
        const chance = 0.55 + Math.min(0.35, stepCountRef.current * 0.02)
        if (Math.random() < chance) triggerEncounter()
        else setMessage('霧裡有聲響……還沒撞上。')
      }
    },
    [triggerEncounter],
  )

  const finishVictory = useCallback((monster: MonsterData, xpGain: number) => {
    const { player: afterXp, leveled } = applyXp(playerRef.current, xpGain)
    const lootResult = rollLoot(afterXp, monster)
    setPlayer(lootResult.player)
    playerRef.current = lootResult.player
    setLoot({
      xp: xpGain,
      leveled,
      drops: lootResult.drops,
      summary: lootResult.summary,
    })
    setPhase('loot')
    setMessage(leveled ? `升級到 Lv.${lootResult.player.level}！` : '戰利品到手。')
  }, [])

  const doAttack = useCallback(async () => {
    const currentCombat = combatRef.current
    if (!currentCombat || currentCombat.busy || phaseRef.current !== 'combat') return

    setCombat((c) => (c ? { ...c, busy: true } : c))
    const currentPlayer = playerRef.current
    const strike = playerStrike(currentPlayer, currentCombat.monster.armor)

    if (!strike.hit) {
      appendLog('揮空了。')
    } else {
      const monsterHp = Math.max(0, currentCombat.monsterHp - strike.damage)
      appendLog(
        strike.crit
          ? `暴擊！${strike.damage} 傷`
          : `命中 ${currentCombat.monster.nameZh} ${strike.damage}`,
      )
      setCombat((c) => (c ? { ...c, monsterHp, busy: true } : c))
      if (monsterHp <= 0) {
        await wait(280)
        finishVictory(currentCombat.monster, currentCombat.monster.xp)
        return
      }
    }

    await wait(340)
    const counter = monsterStrike(currentCombat.monster, playerRef.current)
    if (!counter.hit) {
      appendLog(`${currentCombat.monster.nameZh}打空了。`)
      setCombat((c) => (c ? { ...c, busy: false } : c))
      return
    }

    appendLog(`挨了 ${counter.damage} 傷`)
    setPlayer((current) => {
      const hp = Math.max(0, current.hp - counter.damage)
      const next = { ...current, hp }
      playerRef.current = next
      if (hp <= 0) {
        setPhase('defeat')
        setMessage('你倒在霧林裡……')
      }
      return next
    })
    setCombat((c) => (c ? { ...c, busy: false } : c))
  }, [appendLog, finishVictory])

  const doHeal = useCallback(() => {
    const currentCombat = combatRef.current
    if (!currentCombat || currentCombat.busy || phaseRef.current !== 'combat') return
    if (playerRef.current.herbs <= 0) {
      appendLog('沒有草藥了。')
      return
    }

    const before = playerRef.current
    const healed = healPlayer(before, true)
    const gained = healed.hp - before.hp
    setPlayer(healed)
    playerRef.current = healed
    setCombat({ ...currentCombat, busy: true })
    appendLog(`草藥回復 ${gained}`)

    window.setTimeout(() => {
      const active = combatRef.current
      if (!active) return
      const counter = monsterStrike(active.monster, playerRef.current)
      if (counter.hit) {
        appendLog(`被偷襲 ${counter.damage}`)
        setPlayer((current) => {
          const hp = Math.max(0, current.hp - counter.damage)
          const next = { ...current, hp }
          playerRef.current = next
          if (hp <= 0) {
            setPhase('defeat')
            setMessage('你倒在霧林裡……')
          }
          return next
        })
      } else {
        appendLog('躲過了。')
      }
      setCombat((c) => (c ? { ...c, busy: false } : c))
    }, 340)
  }, [appendLog])

  const doFlee = useCallback(() => {
    const currentCombat = combatRef.current
    if (!currentCombat || currentCombat.busy || phaseRef.current !== 'combat') return

    if (roll(1, 100) <= fleeChance(playerRef.current)) {
      setCombat(null)
      setPhase('explore')
      setMessage('僥倖逃進樹叢。')
      return
    }

    setCombat({ ...currentCombat, busy: true })
    appendLog('逃失敗！')
    window.setTimeout(() => {
      const active = combatRef.current
      if (!active) return
      const counter = monsterStrike(active.monster, playerRef.current)
      if (counter.hit) {
        appendLog(`被追上，挨了 ${counter.damage}`)
        setPlayer((current) => {
          const hp = Math.max(0, current.hp - counter.damage)
          const next = { ...current, hp }
          playerRef.current = next
          if (hp <= 0) {
            setPhase('defeat')
            setMessage('你倒在霧林裡……')
          }
          return next
        })
      }
      setCombat((c) => (c ? { ...c, busy: false } : c))
    }, 300)
  }, [appendLog])

  const continueAfterBanner = useCallback(() => {
    if (phaseRef.current === 'defeat') {
      startExplore(createPlayer())
      return
    }
    if (phaseRef.current === 'loot') startExplore()
  }, [startExplore])

  useEffect(() => {
    attackHandlerRef.current = () => {
      void doAttack()
    }
  }, [doAttack])

  useEffect(() => {
    continueHandlerRef.current = continueAfterBanner
  }, [continueAfterBanner])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) {
        event.preventDefault()
      }
      if (keysRef.current.has(key) && event.repeat) return
      keysRef.current.add(key)

      if (key === 'arrowup' || key === 'w') tryMove('up')
      else if (key === 'arrowdown' || key === 's') tryMove('down')
      else if (key === 'arrowleft' || key === 'a') tryMove('left')
      else if (key === 'arrowright' || key === 'd') tryMove('right')
      else if (key === ' ' || key === 'enter') {
        if (phaseRef.current === 'combat') attackHandlerRef.current()
        else if (phaseRef.current === 'loot' || phaseRef.current === 'defeat') {
          continueHandlerRef.current()
        }
      }
    }
    const onKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.key.toLowerCase())
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [tryMove])

  useEffect(() => {
    let raf = 0
    const loop = (time: number) => {
      if (phaseRef.current === 'explore' && time - lastMoveRef.current > 140) {
        const keys = keysRef.current
        let dir: Dir | null = holdDirRef.current
        if (keys.has('arrowup') || keys.has('w')) dir = 'up'
        else if (keys.has('arrowdown') || keys.has('s')) dir = 'down'
        else if (keys.has('arrowleft') || keys.has('a')) dir = 'left'
        else if (keys.has('arrowright') || keys.has('d')) dir = 'right'
        if (dir) {
          tryMove(dir)
          lastMoveRef.current = time
        }
      }

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        paintWorld(ctx, MAP, posRef.current, facingRef.current, time)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tryMove])

  const bindPad = (dir: Dir) => ({
    onClick: (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      tryMove(dir)
    },
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      holdDirRef.current = dir
      tryMove(dir)
      lastMoveRef.current = performance.now()
    },
    onPointerUp: () => {
      holdDirRef.current = null
    },
    onPointerCancel: () => {
      holdDirRef.current = null
    },
    onPointerLeave: () => {
      holdDirRef.current = null
    },
  })

  const hpPct = useMemo(() => Math.round((player.hp / player.maxHp) * 100), [player])
  const xpPct = useMemo(() => Math.round((player.xp / player.xpToNext) * 100), [player])
  const monPct = combat ? Math.round((combat.monsterHp / combat.monster.hp) * 100) : 0
  const inCombat = phase === 'combat' && combat

  return (
    <div className="raid-play">
      <div className="raid-play__glow" aria-hidden="true" />

      <div className="raid-stage-wrap">
        <section className={`raid-stage ${inCombat ? 'is-combat' : ''}`}>
          <canvas
            ref={canvasRef}
            className="raid-canvas"
            width={WIDTH}
            height={HEIGHT}
            role="img"
            aria-label="哥布林霧林地圖"
          />

          <div className="raid-topbar">
            <Link to="/tools" className="raid-exit">
              ← 離開
            </Link>
            <div className="raid-top__title">
              <p>Goblin Raid</p>
              <h1>哥布林討伐</h1>
            </div>
            <div className="raid-top__level">Lv.{player.level}</div>
          </div>

          <div className="raid-hud">
            {!inCombat && phase === 'explore' && (
              <aside className="raid-sheet">
                <div className="portrait portrait--hero" aria-hidden="true">
                  <span className="portrait__face" />
                  <span className="portrait__cape" />
                  <span className="portrait__band" />
                </div>
                <div>
                  <p className="eyebrow">Fog Ranger</p>
                  <h2>霧林巡衛</h2>
                </div>
                <div className="stat-grid">
                  <div><span>力量</span><strong>{player.strength}</strong></div>
                  <div><span>體質</span><strong>{player.vitality}</strong></div>
                  <div><span>幸運</span><strong>{player.luck}</strong></div>
                  <div><span>防禦</span><strong>{player.defense}</strong></div>
                  <div><span>金幣</span><strong>{player.gold}</strong></div>
                  <div><span>草藥</span><strong>{player.herbs}</strong></div>
                </div>
                <div className="raid-meters">
                  <div>
                    <span>
                      血量 {player.hp}/{player.maxHp}
                    </span>
                    <div className="bar">
                      <i style={{ width: `${hpPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <span>
                      XP {player.xp}/{player.xpToNext} · 擊殺 {player.kills}
                    </span>
                    <div className="bar bar--xp">
                      <i style={{ width: `${xpPct}%` }} />
                    </div>
                  </div>
                </div>
              </aside>
            )}

            {!inCombat && phase === 'explore' && <p className="raid-hint">{message}</p>}
          </div>

          {inCombat && combat && (
            <div className="raid-combat" style={{ '--mon': combat.monster.color } as CSSProperties}>
              <div className="duel">
                <div className="duel__side">
                  <div className="portrait portrait--hero portrait--sm" aria-hidden="true">
                    <span className="portrait__face" />
                    <span className="portrait__cape" />
                    <span className="portrait__band" />
                  </div>
                  <p>巡衛</p>
                </div>
                <p className="duel__vs">VS</p>
                <div className="duel__side">
                  <div
                    className={`portrait portrait--monster portrait--${combat.monster.id}`}
                    style={{ '--mon': combat.monster.color } as CSSProperties}
                    aria-hidden="true"
                  >
                    <span className="portrait__body" />
                    <span className="portrait__eye portrait__eye--l" />
                    <span className="portrait__eye portrait__eye--r" />
                    <span className="portrait__ear portrait__ear--l" />
                    <span className="portrait__ear portrait__ear--r" />
                  </div>
                  <p>{combat.monster.nameZh}</p>
                </div>
              </div>
              <div className="combat-head">
                <div>
                  <p className="eyebrow">{combat.monster.name}</p>
                  <h2>{combat.monster.nameZh}</h2>
                  <p>
                    血量 {player.hp}/{player.maxHp}
                  </p>
                </div>
                <div className="combat-hp">
                  <span>
                    {combat.monsterHp}/{combat.monster.hp}
                  </span>
                  <div className="bar bar--enemy">
                    <i style={{ width: `${monPct}%` }} />
                  </div>
                </div>
              </div>
              <ul className="combat-log">
                {combat.log.map((line, index) => (
                  <li key={`${index}-${line}`}>{line}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <footer className="raid-dock">
        {(phase === 'loot' || phase === 'defeat' || phase === 'boot') && (
          <div className="raid-banner">
            {phase === 'loot' && loot ? (
              <>
                <p className="raid-banner__lead">
                  {loot.leveled ? '升級！' : '勝利！'} +{loot.xp} XP
                </p>
                <ul className="loot-list">
                  {loot.drops.map((drop, index) => (
                    <li key={`${drop.id}-${index}`}>
                      <strong>{drop.name}</strong>
                      <span>{loot.summary[index] ?? drop.description}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="raid-banner__lead">{message}</p>
            )}
            {phase !== 'boot' && (
              <button type="button" className="btn btn--primary" onClick={continueAfterBanner}>
                {phase === 'defeat' ? '重新出發' : '繼續巡邏'}
              </button>
            )}
          </div>
        )}

        {inCombat && combat ? (
          <div className="raid-actions" aria-label="戰鬥操作">
            <button
              type="button"
              className="btn btn--primary btn--attack"
              disabled={combat.busy}
              onClick={() => void doAttack()}
            >
              攻擊
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              disabled={combat.busy || player.herbs <= 0}
              onClick={doHeal}
            >
              療傷（{player.herbs}）
            </button>
            <button type="button" className="btn btn--ghost" disabled={combat.busy} onClick={doFlee}>
              逃跑
            </button>
          </div>
        ) : phase === 'explore' ? (
          <div className="raid-pad" aria-label="行動鍵">
            <button type="button" {...bindPad('up')}>
              ↑
            </button>
            <div className="raid-pad__mid">
              <button type="button" {...bindPad('left')}>
                ←
              </button>
              <button type="button" {...bindPad('down')}>
                ↓
              </button>
              <button type="button" {...bindPad('right')}>
                →
              </button>
            </div>
          </div>
        ) : null}
        <p className="raid-dock__meta">
          WASD 移動 · 空白鍵攻擊 · 不存檔 · {source === 'api' ? 'D&D 5e API' : '本地怪物表'}
        </p>
      </footer>
    </div>
  )
}
