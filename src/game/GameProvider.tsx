'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { EquipmentSlot, MapId, PanelId, Player, SkillClass } from '@/types/game'
import { calcPlayerDpsStats } from '@/systems/DamageSystem'
import { castBurstSkill, createRuntime, tickCombat, drinkPotion, type CombatTickResult } from '@/systems/CombatSystem'
import { loadPlayer, savePlayer } from '@/systems/SaveSystem'
import { buyUpgrade } from '@/systems/UpgradeSystem'
import { unlockSkill } from '@/systems/SkillTreeSystem'
import { claimQuest } from '@/systems/QuestSystem'
import { buyShopOffer } from '@/systems/ShopSystem'
import {
  enchantItem,
  equipItem,
  reforgeItem,
  sellItem,
  toggleFavorite,
  toggleLock,
  unequipItem,
  upgradeItem,
} from '@/systems/ForgeSystem'
import { canPrestige, doPrestige, prestigeRequirement } from '@/systems/PrestigeSystem'
import { calcOfflineGold } from '@/systems/EconomySystem'
import { canTravel } from '@/systems/WaveSystem'
import { resumeAudio, playSfx } from '@/systems/AudioSystem'
import { evaluateAchievements } from '@/systems/AchievementSystem'

type GameContextValue = {
  player: Player
  stats: ReturnType<typeof calcPlayerDpsStats>
  runtime: ReturnType<typeof createRuntime>
  panel: PanelId
  setPanel: (panel: PanelId) => void
  offlineGold: number
  claimOffline: () => void
  actions: {
    toggleAuto: () => void
    castSkill: () => void
    drinkPotion: () => void
    buyUpgrade: (id: Parameters<typeof buyUpgrade>[1]) => void
    unlockSkill: (id: string) => void
    setClass: (id: SkillClass) => void
    claimQuest: (id: string) => void
    buyOffer: (id: string) => void
    equip: (uid: string) => void
    unequip: (slot: EquipmentSlot) => void
    sell: (uid: string) => void
    lock: (uid: string) => void
    favorite: (uid: string) => void
    forgeUpgrade: (uid: string) => void
    forgeEnchant: (uid: string) => void
    forgeReforge: (uid: string) => void
    travel: (mapId: MapId) => void
    prestige: () => void
    save: () => void
    patchSettings: (patch: Partial<Player['settings']>) => void
    setHeroSkin: (skin: string) => void
    revive: () => void
  }
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [runtime, setRuntime] = useState(() => createRuntime())
  const [panel, setPanel] = useState<PanelId>('battle')
  const [offlineGold, setOfflineGold] = useState(0)
  const playerRef = useRef<Player | null>(null)
  const runtimeRef = useRef(runtime)

  useEffect(() => {
    const loaded = loadPlayer()
    playerRef.current = loaded.player
    setPlayer(loaded.player)
    setOfflineGold(calcOfflineGold(loaded.player, loaded.offlineMs))
  }, [])

  useEffect(() => {
    playerRef.current = player
  }, [player])
  useEffect(() => {
    runtimeRef.current = runtime
  }, [runtime])

  const playerReady = Boolean(player)
  useEffect(() => {
    if (!playerReady) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const current = playerRef.current
      if (!current) {
        raf = requestAnimationFrame(loop)
        return
      }
      if (current.hp <= 0) {
        last = now
        raf = requestAnimationFrame(loop)
        return
      }
      const targetDt = current.settings.fps === 30 ? 1000 / 30 : 1000 / 60
      const elapsed = now - last
      if (elapsed >= targetDt) {
        const dt = Math.min(0.05, elapsed / 1000)
        last = now
        const result: CombatTickResult = tickCombat(current, runtimeRef.current, dt)
        playerRef.current = result.player
        runtimeRef.current = result.runtime
        setPlayer(result.player)
        setRuntime(result.runtime)
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [player?.settings.fps, playerReady])

  // Autosave every 30s
  useEffect(() => {
    if (!player?.settings.autoSave) return
    const id = window.setInterval(() => {
      if (playerRef.current) savePlayer(playerRef.current)
    }, 30_000)
    return () => window.clearInterval(id)
  }, [player?.settings.autoSave])

  const stats = useMemo(() => (player ? calcPlayerDpsStats(player) : calcPlayerDpsStats(loadPlayer().player)), [player])

  const updatePlayer = useCallback((recipe: (p: Player) => Player | null) => {
    setPlayer((current) => {
      if (!current) return current
      const next = recipe(current)
      if (!next) return current
      const evaluated = evaluateAchievements(next)
      playerRef.current = evaluated
      return evaluated
    })
  }, [])

  const actions = useMemo<GameContextValue['actions']>(() => ({
    toggleAuto: () => {
      resumeAudio()
      playSfx('button', playerRef.current?.settings.sound)
      updatePlayer((p) => ({ ...p, autoBattle: !p.autoBattle }))
    },
    castSkill: () => {
      resumeAudio()
      const current = playerRef.current
      if (!current) return
      const result = castBurstSkill(current, runtimeRef.current)
      if (!result) return
      playerRef.current = result.player
      runtimeRef.current = result.runtime
      setPlayer(result.player)
      setRuntime(result.runtime)
    },
    drinkPotion: () => updatePlayer((p) => drinkPotion(p)),
    buyUpgrade: (id) => {
      updatePlayer((p) => {
        const next = buyUpgrade(p, id)
        if (next) playSfx('upgrade', p.settings.sound)
        return next
      })
    },
    unlockSkill: (id) => updatePlayer((p) => unlockSkill(p, id)),
    setClass: (id) => updatePlayer((p) => ({ ...p, skillClass: id })),
    claimQuest: (id) => updatePlayer((p) => claimQuest(p, id)),
    buyOffer: (id) => {
      updatePlayer((p) => {
        const next = buyShopOffer(p, id)
        if (next) playSfx('loot', p.settings.sound)
        return next
      })
    },
    equip: (uid) => updatePlayer((p) => equipItem(p, uid)),
    unequip: (slot) => updatePlayer((p) => unequipItem(p, slot)),
    sell: (uid) => updatePlayer((p) => sellItem(p, uid)),
    lock: (uid) => updatePlayer((p) => toggleLock(p, uid)),
    favorite: (uid) => updatePlayer((p) => toggleFavorite(p, uid)),
    forgeUpgrade: (uid) => updatePlayer((p) => upgradeItem(p, uid)),
    forgeEnchant: (uid) => updatePlayer((p) => enchantItem(p, uid)),
    forgeReforge: (uid) => updatePlayer((p) => reforgeItem(p, uid)),
    travel: (mapId) =>
      updatePlayer((p) => {
        if (!canTravel(p, mapId)) return p
        runtimeRef.current = { ...createRuntime(), offlineClaimed: runtimeRef.current.offlineClaimed }
        setRuntime(runtimeRef.current)
        return { ...p, currentMap: mapId, combo: 0 }
      }),
    prestige: () => {
      updatePlayer((p) => {
        if (!canPrestige(p)) return p
        runtimeRef.current = createRuntime()
        setRuntime(runtimeRef.current)
        playSfx('levelup', p.settings.sound)
        return doPrestige(p)
      })
    },
    save: () => {
      if (playerRef.current) {
        savePlayer(playerRef.current)
        playSfx('button', playerRef.current.settings.sound)
      }
    },
    patchSettings: (patch) => updatePlayer((p) => ({ ...p, settings: { ...p.settings, ...patch } })),
    setHeroSkin: (skin) =>
      updatePlayer((p) => {
        const allowed =
          skin === 'default' ||
          skin === 'assassin' ||
          skin === 'mage' ||
          skin === 'tank' ||
          (skin === 'ember' && p.achievements.includes('skin-ember'))
        if (!allowed) return p
        return { ...p, heroSkin: skin }
      }),
    revive: () =>
      updatePlayer((p) => {
        const s = calcPlayerDpsStats(p)
        runtimeRef.current = createRuntime()
        setRuntime(runtimeRef.current)
        return { ...p, hp: s.maxHp, combo: 0, currentWave: Math.max(1, p.currentWave - 1) }
      }),
  }), [updatePlayer])

  const claimOffline = useCallback(() => {
    if (!offlineGold) {
      setRuntime((r) => ({ ...r, offlineClaimed: true }))
      return
    }
    updatePlayer((p) => ({ ...p, gold: p.gold + offlineGold }))
    setOfflineGold(0)
    setRuntime((r) => ({ ...r, offlineClaimed: true }))
  }, [offlineGold, updatePlayer])

  if (!player) {
    return (
      <div className="flex h-svh items-center justify-center bg-raid-bg text-raid-ink">
        載入討伐資料中…
      </div>
    )
  }

  const value: GameContextValue = {
    player,
    stats,
    runtime,
    panel,
    setPanel,
    offlineGold,
    claimOffline,
    actions,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used in GameProvider')
  return ctx
}

export function usePrestigeInfo() {
  const { player } = useGame()
  return { can: canPrestige(player), need: prestigeRequirement(player) }
}
