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
import type { Dir, DropItem, GamePhase, MonsterData, PlayerStats, Vec } from './types'
import './goblin-raid.css'

const TILE = 32
const COLS = 15
const ROWS = 11
const WIDTH = COLS * TILE
const HEIGHT = ROWS * TILE

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

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
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
  const [message, setMessage] = useState('正在從森林召喚哥布林……')
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
    setMessage('霧林深處有動靜。往紫色霧氣走，就會撞上哥布林。')
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
      log: [`${monster.nameZh}擋路！`],
      busy: false,
    }
    setCombat(next)
    combatRef.current = next
    setPhase('combat')
    setMessage('點下方「攻擊」按鈕，或按空白鍵')
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
        setMessage('營地篝火暖和了一些。')
        return
      }
      if (tile === 3) {
        // Waiting-game friendly: mist almost always finds a fight after a few steps.
        const chance = 0.55 + Math.min(0.35, stepCountRef.current * 0.02)
        if (Math.random() < chance) triggerEncounter()
        else setMessage('霧裡有腳步聲……暫時沒撞上。')
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
    setMessage(leveled ? `升級到 Lv.${lootResult.player.level}！還撿到戰利品。` : '戰鬥結束，撿起戰利品。')
  }, [])

  const doAttack = useCallback(async () => {
    const currentCombat = combatRef.current
    if (!currentCombat || currentCombat.busy || phaseRef.current !== 'combat') return

    setCombat((c) => (c ? { ...c, busy: true } : c))
    const currentPlayer = playerRef.current
    const strike = playerStrike(currentPlayer, currentCombat.monster.armor)

    if (!strike.hit) {
      appendLog('你揮空了。')
    } else {
      const monsterHp = Math.max(0, currentCombat.monsterHp - strike.damage)
      appendLog(
        strike.crit
          ? `暴擊！對 ${currentCombat.monster.nameZh} 造成 ${strike.damage} 傷。`
          : `砍中 ${currentCombat.monster.nameZh}，造成 ${strike.damage} 傷。`,
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
      appendLog(`${currentCombat.monster.nameZh}沒打中你。`)
      setCombat((c) => (c ? { ...c, busy: false } : c))
      return
    }

    appendLog(`${currentCombat.monster.nameZh}回擊 ${counter.damage} 傷。`)
    setPlayer((current) => {
      const hp = Math.max(0, current.hp - counter.damage)
      const next = { ...current, hp }
      playerRef.current = next
      if (hp <= 0) {
        setPhase('defeat')
        setMessage('你倒在霧林裡……可重新出發（進度不保存）')
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
    appendLog(`喝下草藥，回復 ${gained} HP。`)

    window.setTimeout(() => {
      const active = combatRef.current
      if (!active) return
      const counter = monsterStrike(active.monster, playerRef.current)
      if (counter.hit) {
        appendLog(`${active.monster.nameZh}趁機砸了你 ${counter.damage}。`)
        setPlayer((current) => {
          const hp = Math.max(0, current.hp - counter.damage)
          const next = { ...current, hp }
          playerRef.current = next
          if (hp <= 0) {
            setPhase('defeat')
            setMessage('你倒在霧林裡……可重新出發（進度不保存）')
          }
          return next
        })
      } else {
        appendLog('敵人撲空了。')
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
      setMessage('靠著運氣鑽進樹叢跑掉了。')
      return
    }

    setCombat({ ...currentCombat, busy: true })
    appendLog('逃跑失敗！')
    window.setTimeout(() => {
      const active = combatRef.current
      if (!active) return
      const counter = monsterStrike(active.monster, playerRef.current)
      if (counter.hit) {
        appendLog(`被追上，挨了 ${counter.damage}。`)
        setPlayer((current) => {
          const hp = Math.max(0, current.hp - counter.damage)
          const next = { ...current, hp }
          playerRef.current = next
          if (hp <= 0) {
            setPhase('defeat')
            setMessage('你倒在霧林裡……可重新出發（進度不保存）')
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
        ctx.clearRect(0, 0, WIDTH, HEIGHT)
        for (let y = 0; y < ROWS; y += 1) {
          for (let x = 0; x < COLS; x += 1) {
            const tile = MAP[y]![x]!
            const px = x * TILE
            const py = y * TILE
            if (tile === 1) {
              ctx.fillStyle = '#1d3a2d'
              ctx.fillRect(px, py, TILE, TILE)
              ctx.fillStyle = '#2f5a43'
              ctx.beginPath()
              ctx.moveTo(px + 16, py + 4)
              ctx.lineTo(px + 28, py + 26)
              ctx.lineTo(px + 4, py + 26)
              ctx.fill()
            } else if (tile === 2) {
              ctx.fillStyle = '#cbb892'
              ctx.fillRect(px, py, TILE, TILE)
              ctx.fillStyle = '#b79d74'
              ctx.fillRect(px + 4, py + 10, 8, 4)
              ctx.fillRect(px + 18, py + 20, 10, 3)
            } else if (tile === 3) {
              ctx.fillStyle = '#6d7a55'
              ctx.fillRect(px, py, TILE, TILE)
              const pulse = 0.35 + Math.sin(time / 280 + x + y) * 0.15
              ctx.fillStyle = `rgba(120, 72, 180, ${pulse})`
              ctx.fillRect(px, py, TILE, TILE)
            } else if (tile === 4) {
              ctx.fillStyle = '#7a8f5d'
              ctx.fillRect(px, py, TILE, TILE)
              ctx.fillStyle = '#e4572e'
              ctx.beginPath()
              ctx.arc(px + 16, py + 18, 6 + Math.sin(time / 200) * 1.5, 0, Math.PI * 2)
              ctx.fill()
            } else {
              ctx.fillStyle = (x + y) % 2 === 0 ? '#8fad6f' : '#84a366'
              ctx.fillRect(px, py, TILE, TILE)
            }
          }
        }

        const grad = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 40, WIDTH / 2, HEIGHT / 2, 280)
        grad.addColorStop(0, 'rgba(0,0,0,0)')
        grad.addColorStop(1, 'rgba(18, 28, 22, 0.28)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, WIDTH, HEIGHT)

        const p = posRef.current
        const bob = Math.sin(time / 120) * 1.5
        const px = p.x * TILE + 4
        const py = p.y * TILE + 2 + bob
        ctx.fillStyle = '#163a33'
        drawRoundRect(ctx, px + 4, py + 14, 20, 14, 4)
        ctx.fill()
        ctx.fillStyle = '#f0d7a8'
        ctx.beginPath()
        ctx.arc(px + 14, py + 10, 7, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#e4572e'
        drawRoundRect(ctx, px + 8, py + 4, 12, 5, 2)
        ctx.fill()
        ctx.fillStyle = '#13241f'
        const eyeX =
          facingRef.current === 'left' ? px + 10 : facingRef.current === 'right' ? px + 18 : px + 14
        ctx.fillRect(eyeX, py + 9, 2, 2)
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
    <div className="goblin-raid">
      <div className="goblin-raid__hero">
        <div className="portrait portrait--hero" aria-hidden="true">
          <span className="portrait__face" />
          <span className="portrait__cape" />
          <span className="portrait__band" />
        </div>
        <div className="goblin-raid__hero-copy">
          <p className="eyebrow">Fog Ranger</p>
          <h2>霧林巡衛</h2>
          <div className="stat-grid">
            <div>
              <span>力量</span>
              <strong>{player.strength}</strong>
            </div>
            <div>
              <span>體質</span>
              <strong>{player.vitality}</strong>
            </div>
            <div>
              <span>幸運</span>
              <strong>{player.luck}</strong>
            </div>
            <div>
              <span>防禦</span>
              <strong>{player.defense}</strong>
            </div>
            <div>
              <span>金幣</span>
              <strong>{player.gold}</strong>
            </div>
            <div>
              <span>草藥</span>
              <strong>{player.herbs}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="goblin-raid__hud">
        <div className="goblin-raid__stat">
          <span>Lv.{player.level}</span>
          <strong>
            血量 {player.hp}/{player.maxHp}
          </strong>
          <div className="bar">
            <i style={{ width: `${hpPct}%` }} />
          </div>
        </div>
        <div className="goblin-raid__stat">
          <span>擊殺 {player.kills}</span>
          <strong>
            XP {player.xp}/{player.xpToNext}
          </strong>
          <div className="bar bar--xp">
            <i style={{ width: `${xpPct}%` }} />
          </div>
        </div>
      </div>

      <div className={`goblin-raid__stage ${inCombat ? 'is-combat' : ''}`}>
        <canvas
          ref={canvasRef}
          className="goblin-raid__canvas"
          width={WIDTH}
          height={HEIGHT}
          role="img"
          aria-label="哥布林霧林地圖"
        />

        {inCombat && combat && (
          <div
            className="goblin-raid__combat"
            style={{ '--mon': combat.monster.color } as CSSProperties}
          >
            <div className="duel">
              <div className="duel__side">
                <div className="portrait portrait--hero portrait--sm" aria-hidden="true">
                  <span className="portrait__face" />
                  <span className="portrait__cape" />
                  <span className="portrait__band" />
                </div>
                <p>霧林巡衛</p>
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

        {(phase === 'loot' || phase === 'defeat' || phase === 'boot') && (
          <div className="goblin-raid__banner">
            {phase === 'loot' && loot ? (
              <>
                <p>
                  {loot.leveled ? `升級！` : `勝利！`} +{loot.xp} XP
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
              <p>{message}</p>
            )}
            {phase !== 'boot' && (
              <button type="button" className="btn btn--primary" onClick={continueAfterBanner}>
                {phase === 'defeat' ? '重新出發' : '繼續巡邏'}
              </button>
            )}
          </div>
        )}
      </div>

      <p className="goblin-raid__hint">{message}</p>

      {inCombat && combat ? (
        <div className="goblin-raid__actions" aria-label="戰鬥操作">
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
      ) : (
        <div className="goblin-raid__pad" aria-label="行動鍵">
          <button type="button" {...bindPad('up')}>
            ↑
          </button>
          <div className="goblin-raid__pad-mid">
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
      )}

      <p className="goblin-raid__meta">
        探索用方向鍵 · 戰鬥用下方按鈕 / 空白鍵 · 不存檔 · 怪物來源：
        {source === 'api' ? 'D&D 5e API' : '本地備用'}
      </p>
    </div>
  )
}
