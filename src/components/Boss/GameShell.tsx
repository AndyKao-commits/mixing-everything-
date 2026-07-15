'use client'

import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { GameProvider, useGame } from '@/game/GameProvider'
import { TopBar, BattleScene } from '@/components/Combat/BattleScene'
import { UpgradePanel } from '@/components/Upgrade/UpgradePanel'
import { InventoryPanel } from '@/components/Inventory/InventoryPanel'
import { ShopPanel } from '@/components/Shop/ShopPanel'
import { QuestPanel } from '@/components/Quest/QuestPanel'
import { SkillTreePanel } from '@/components/SkillTree/SkillTreePanel'
import { AchievementPanel } from '@/components/Achievement/AchievementPanel'
import { SettingsPanel } from '@/components/Settings/SettingsPanel'
import { BossPanel } from '@/components/Boss/BossPanel'
import type { PanelId } from '@/types/game'

const NAV: { id: PanelId; label: string }[] = [
  { id: 'battle', label: '戰鬥' },
  { id: 'inventory', label: '背包' },
  { id: 'upgrade', label: '強化' },
  { id: 'skills', label: '技能' },
  { id: 'quest', label: '任務' },
  { id: 'shop', label: '商店' },
  { id: 'boss', label: '地圖' },
  { id: 'achievement', label: '成就' },
  { id: 'settings', label: '設定' },
]

function Shell() {
  const { panel, setPanel } = useGame()

  return (
    <div className="relative min-h-svh overflow-hidden bg-raid-bg text-raid-ink">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(61,190,122,0.18),transparent_40%),radial-gradient(circle_at_90%_10%,rgba(240,193,75,0.12),transparent_35%)]" />
      <div className="relative mx-auto flex min-h-svh max-w-5xl flex-col gap-3 p-3 pb-24 sm:p-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-raid-accent">Goblin Raid Remastered</p>
            <h1 className="font-display text-xl font-bold sm:text-2xl">哥布林討伐 2.0</h1>
          </div>
          <Link href="/tools" className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-sm">
            ← 工具站
          </Link>
        </header>

        <TopBar />
        <BattleScene />

        <AnimatePresence mode="wait">
          {panel === 'upgrade' ? <UpgradePanel onClose={() => setPanel('battle')} /> : null}
          {panel === 'inventory' ? <InventoryPanel onClose={() => setPanel('battle')} /> : null}
          {panel === 'shop' ? <ShopPanel onClose={() => setPanel('battle')} /> : null}
          {panel === 'quest' ? <QuestPanel onClose={() => setPanel('battle')} /> : null}
          {panel === 'skills' ? <SkillTreePanel onClose={() => setPanel('battle')} /> : null}
          {panel === 'achievement' ? <AchievementPanel onClose={() => setPanel('battle')} /> : null}
          {panel === 'settings' ? <SettingsPanel onClose={() => setPanel('battle')} /> : null}
          {panel === 'boss' ? <BossPanel onClose={() => setPanel('battle')} /> : null}
        </AnimatePresence>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-raid-panel/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-5 gap-1 p-2 sm:grid-cols-9">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPanel(item.id)}
              className={`rounded-lg px-1 py-2 text-[11px] sm:text-xs ${panel === item.id ? 'bg-raid-accent text-raid-bg' : 'text-raid-muted hover:bg-white/5'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export function GoblinRaidRemastered() {
  return (
    <GameProvider>
      <Shell />
    </GameProvider>
  )
}
