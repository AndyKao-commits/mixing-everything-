import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react'
import { Link } from 'react-router-dom'
import {
  allocatePoint,
  applyXp,
  createPlayer,
  fleeChance,
  healPlayer,
  monsterStrike,
  playerStrike,
  roll,
  rollLoot,
  STAT_LABELS,
  applyBagItem,
} from './combat'
import { loadMonsterRoster, pickMonster } from './monsters'
import { COLS, HEIGHT, paintWorld, ROWS, WIDTH } from './render'
import type { Dir, DropItem, GamePhase, MonsterData, PlayerStats, StatKey, Vec, ZoneId } from './types'
import { findPortalTarget, ZONES } from './world'
import './goblin-raid.css'

const DIRS: Record<Dir, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const STEP_MS = 260
const HOLD_DELAY_MS = 420

type CombatState = {
  monster: MonsterData
  monsterHp: number
  log: string[]
  busy: boolean
}

type LootState = {
  xp: number
  leveled: boolean
  pointsGained: number
  drops: DropItem[]
  summary: string[]
}

function canWalk(map: number[][], x: number, y: number): boolean {
  if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return false
  return map[y]![x] !== 1
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
  const holdStartedRef = useRef(0)
  const lastMoveRef = useRef(0)
  const posRef = useRef<Vec>({ ...ZONES.mistwood.spawn })
  const facingRef = useRef<Dir>('down')
  const stepCountRef = useRef(0)
  const phaseRef = useRef<GamePhase>('boot')
  const combatRef = useRef<CombatState | null>(null)
  const playerRef = useRef<PlayerStats>(createPlayer())
  const rosterRef = useRef<MonsterData[]>([])
  const zoneIdRef = useRef<ZoneId>('mistwood')
  const sheetOpenRef = useRef(false)
  const attackHandlerRef = useRef<() => void>(() => {})
  const continueHandlerRef = useRef<() => void>(() => {})

  const [phase, setPhase] = useState<GamePhase>('boot')
  const [player, setPlayer] = useState<PlayerStats>(() => createPlayer())
  const [roster, setRoster] = useState<MonsterData[]>([])
  const [source, setSource] = useState<'api' | 'fallback'>('fallback')
  const [message, setMessage] = useState('霧在林間流動……')
  const [combat, setCombat] = useState<CombatState | null>(null)
  const [loot, setLoot] = useState<LootState | null>(null)
  const [zoneId, setZoneId] = useState<ZoneId>('mistwood')
  const [sheetOpen, setSheetOpen] = useState(false)

  const zone = ZONES[zoneId]

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
    zoneIdRef.current = zoneId
  }, [zoneId])
  useEffect(() => {
    sheetOpenRef.current = sheetOpen
  }, [sheetOpen])

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  const startExplore = useCallback((freshPlayer?: PlayerStats, nextZone: ZoneId = 'mistwood') => {
    const z = ZONES[nextZone]
    posRef.current = { ...z.spawn }
    facingRef.current = 'down'
    stepCountRef.current = 0
    setCombat(null)
    setLoot(null)
    setZoneId(nextZone)
    zoneIdRef.current = nextZone
    if (freshPlayer) {
      setPlayer(freshPlayer)
      playerRef.current = freshPlayer
    }
    setPhase('explore')
    setMessage(z.hint)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const loaded = await loadMonsterRoster()
      if (cancelled) return
      setRoster(loaded.monsters)
      rosterRef.current = loaded.monsters
      setSource(loaded.source)
      startExplore(createPlayer(), 'mistwood')
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
    const levelBias = zoneIdRef.current === 'marsh' ? 2 : zoneIdRef.current === 'ruins' ? 1 : 0
    const monster = pickMonster(list, playerRef.current.level + levelBias)
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
      if (phaseRef.current !== 'explore' || sheetOpenRef.current) return
      const currentZone = ZONES[zoneIdRef.current]
      const delta = DIRS[dir]
      const next = { x: posRef.current.x + delta.x, y: posRef.current.y + delta.y }
      facingRef.current = dir
      if (!canWalk(currentZone.map, next.x, next.y)) return
      posRef.current = next
      stepCountRef.current += 1

      const tile = currentZone.map[next.y]![next.x]
      if (tile === 5) {
        const portal = findPortalTarget(currentZone, next)
        if (portal) {
          const dest = ZONES[portal.to]
          posRef.current = { ...portal.spawn }
          setZoneId(portal.to)
          zoneIdRef.current = portal.to
          setMessage(`抵達${dest.nameZh}。${dest.hint}`)
        }
        return
      }
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
        const chance = 0.45 + currentZone.mistBoost + Math.min(0.25, stepCountRef.current * 0.015)
        if (Math.random() < chance) triggerEncounter()
        else setMessage('霧裡有聲響……還沒撞上。')
      }
    },
    [triggerEncounter],
  )

  const finishVictory = useCallback((monster: MonsterData, xpGain: number) => {
    const { player: afterXp, leveled, pointsGained } = applyXp(playerRef.current, xpGain)
    const lootResult = rollLoot(afterXp, monster)
    setPlayer(lootResult.player)
    playerRef.current = lootResult.player
    setLoot({
      xp: xpGain,
      leveled,
      pointsGained,
      drops: lootResult.drops,
      summary: lootResult.summary,
    })
    setPhase('loot')
    setMessage(
      leveled
        ? `升級！獲得 ${pointsGained} 點可配點，打開角色資訊分配。`
        : '戰利品進背包了，打開角色資訊查看／使用。',
    )
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
      startExplore(createPlayer(), 'mistwood')
      return
    }
    if (phaseRef.current === 'loot') {
      setLoot(null)
      setPhase('explore')
      setMessage(ZONES[zoneIdRef.current].hint)
    }
  }, [startExplore])

  const spendPoint = (stat: StatKey) => {
    setPlayer((current) => {
      const next = allocatePoint(current, stat)
      playerRef.current = next
      return next
    })
  }

  const consumeItem = (uid: string) => {
    setPlayer((current) => {
      const next = applyBagItem(current, uid)
      playerRef.current = next
      return next
    })
  }

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
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' ', 'c'].includes(key)) {
        event.preventDefault()
      }
      if (key === 'c') {
        setSheetOpen((open) => !open)
        return
      }
      if (keysRef.current.has(key) && event.repeat) return
      keysRef.current.add(key)

      if (key === 'arrowup' || key === 'w') {
        holdStartedRef.current = performance.now()
        tryMove('up')
        lastMoveRef.current = performance.now()
      } else if (key === 'arrowdown' || key === 's') {
        holdStartedRef.current = performance.now()
        tryMove('down')
        lastMoveRef.current = performance.now()
      } else if (key === 'arrowleft' || key === 'a') {
        holdStartedRef.current = performance.now()
        tryMove('left')
        lastMoveRef.current = performance.now()
      } else if (key === 'arrowright' || key === 'd') {
        holdStartedRef.current = performance.now()
        tryMove('right')
        lastMoveRef.current = performance.now()
      } else if (key === ' ' || key === 'enter') {
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
      if (phaseRef.current === 'explore' && !sheetOpenRef.current) {
        const keys = keysRef.current
        let dir: Dir | null = holdDirRef.current
        if (keys.has('arrowup') || keys.has('w')) dir = 'up'
        else if (keys.has('arrowdown') || keys.has('s')) dir = 'down'
        else if (keys.has('arrowleft') || keys.has('a')) dir = 'left'
        else if (keys.has('arrowright') || keys.has('d')) dir = 'right'

        if (dir) {
          if (!holdStartedRef.current) holdStartedRef.current = time
          const heldFor = time - holdStartedRef.current
          if (heldFor >= HOLD_DELAY_MS && time - lastMoveRef.current >= STEP_MS) {
            tryMove(dir)
            lastMoveRef.current = time
          }
        } else if (!holdDirRef.current) {
          holdStartedRef.current = 0
        }
      }

      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (ctx) {
        paintWorld(ctx, ZONES[zoneIdRef.current].map, posRef.current, facingRef.current, time, zoneIdRef.current)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [tryMove])

  const bindPad = (dir: Dir) => ({
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture?.(event.pointerId)
      holdDirRef.current = dir
      holdStartedRef.current = performance.now()
      tryMove(dir)
      lastMoveRef.current = performance.now()
    },
    onPointerUp: () => {
      holdDirRef.current = null
      holdStartedRef.current = 0
    },
    onPointerCancel: () => {
      holdDirRef.current = null
      holdStartedRef.current = 0
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
            aria-label={`${zone.nameZh}地圖`}
          />

          <div className="raid-topbar">
            <Link to="/tools" className="raid-exit">
              ← 離開
            </Link>
            <div className="raid-top__title">
              <p>{zone.name}</p>
              <h1>{zone.nameZh}</h1>
            </div>
            <button type="button" className="raid-top__level" onClick={() => setSheetOpen(true)}>
              Lv.{player.level}
              {player.freePoints > 0 ? ` · +${player.freePoints}` : ''}
            </button>
          </div>

          <div className="raid-hud">
            {!inCombat && phase === 'explore' && (
              <aside className="raid-sheet">
                <button type="button" className="portrait portrait--hero" onClick={() => setSheetOpen(true)} aria-label="打開角色資訊">
                  <span className="portrait__face" />
                  <span className="portrait__cape" />
                  <span className="portrait__band" />
                </button>
                <div>
                  <p className="eyebrow">Fog Ranger</p>
                  <h2>霧林巡衛</h2>
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
                <button type="button" className="raid-sheet__open" onClick={() => setSheetOpen(true)}>
                  角色資訊{player.freePoints > 0 ? `（可配 ${player.freePoints}）` : ''}
                </button>
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
                  {loot.leveled ? `升級！+${loot.pointsGained} 配點` : '勝利！'} +{loot.xp} XP
                </p>
                <ul className="loot-list">
                  {loot.drops.map((drop, index) => (
                    <li key={`${drop.id}-${index}`}>
                      <strong>{drop.name}</strong>
                      <span>{loot.summary[index] ?? drop.description}</span>
                    </li>
                  ))}
                </ul>
                <div className="raid-banner__row">
                  <button type="button" className="btn btn--ghost" onClick={() => setSheetOpen(true)}>
                    打開角色資訊
                  </button>
                  <button type="button" className="btn btn--primary" onClick={continueAfterBanner}>
                    繼續巡邏
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="raid-banner__lead">{message}</p>
                {phase !== 'boot' && (
                  <button type="button" className="btn btn--primary" onClick={continueAfterBanner}>
                    {phase === 'defeat' ? '重新出發' : '繼續巡邏'}
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {inCombat && combat ? (
          <div className="raid-actions" aria-label="戰鬥操作">
            <button type="button" className="btn btn--primary btn--attack" disabled={combat.busy} onClick={() => void doAttack()}>
              攻擊
            </button>
            <button type="button" className="btn btn--ghost" disabled={combat.busy || player.herbs <= 0} onClick={doHeal}>
              療傷（{player.herbs}）
            </button>
            <button type="button" className="btn btn--ghost" disabled={combat.busy} onClick={doFlee}>
              逃跑
            </button>
          </div>
        ) : phase === 'explore' ? (
          <div className="raid-pad" aria-label="行動鍵">
            <button type="button" {...bindPad('up')}>↑</button>
            <div className="raid-pad__mid">
              <button type="button" {...bindPad('left')}>←</button>
              <button type="button" {...bindPad('down')}>↓</button>
              <button type="button" {...bindPad('right')}>→</button>
            </div>
          </div>
        ) : null}
        <p className="raid-dock__meta">
          一格一步 · C 開角色 · 亮門換區 · {source === 'api' ? 'D&D 5e API' : '本地怪物表'}
        </p>
      </footer>

      {sheetOpen && (
        <div className="raid-modal" role="dialog" aria-label="角色資訊">
          <div className="raid-modal__card">
            <div className="raid-modal__head">
              <div>
                <p className="eyebrow">Character</p>
                <h2>角色資訊 · Lv.{player.level}</h2>
              </div>
              <button type="button" className="btn btn--ghost" onClick={() => setSheetOpen(false)}>
                關閉
              </button>
            </div>

            <div className="raid-modal__stats">
              {(Object.keys(STAT_LABELS) as StatKey[]).map((stat) => (
                <div key={stat} className="raid-modal__stat">
                  <div>
                    <span>{STAT_LABELS[stat]}</span>
                    <strong>{player[stat]}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={player.freePoints <= 0}
                    onClick={() => spendPoint(stat)}
                  >
                    +1
                  </button>
                </div>
              ))}
            </div>

            <p className="raid-modal__points">
              可配點數：<strong>{player.freePoints}</strong>
              {player.freePoints > 0 ? '（升級獲得，自己決定加哪）' : '（再去打怪升級）'}
            </p>

            <div className="raid-modal__bag">
              <h3>背包</h3>
              <p>金幣 {player.gold} · 草藥 {player.herbs}</p>
              {player.bag.length === 0 ? (
                <p className="raid-modal__empty">還沒有裝備掉落。打贏怪物後放這裡，點「使用」加屬性。</p>
              ) : (
                <ul>
                  {player.bag.map((item) => (
                    <li key={item.uid}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.description}</span>
                      </div>
                      <button type="button" className="btn btn--primary" onClick={() => consumeItem(item.uid)}>
                        使用
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="raid-modal__zones">
              <h3>地圖</h3>
              <p>現在：{zone.nameZh}. 踩亮藍色傳送門可前往其他區域。</p>
              <div className="raid-modal__zone-list">
                {(['mistwood', 'ruins', 'marsh'] as ZoneId[]).map((id) => (
                  <span key={id} className={id === zoneId ? 'is-here' : ''}>
                    {ZONES[id].nameZh}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
