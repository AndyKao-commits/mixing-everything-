'use client'

import { MAP_ORDER, MAPS } from '@/data/maps'
import { getCurrentBossDef } from '@/systems/BossSystem'
import { isBossWave } from '@/systems/WaveSystem'
import { useGame } from '@/game/GameProvider'
import { Panel, GhostButton } from '@/components/UI/Primitives'

export function BossPanel({ onClose }: { onClose: () => void }) {
  const { player, actions } = useGame()
  const boss = getCurrentBossDef(player)
  const nextBossWave = Math.ceil(player.currentWave / 10) * 10
  const bossSoon = isBossWave(player.currentWave) || nextBossWave - player.currentWave <= 2

  return (
    <Panel title="Boss / 地圖" onClose={onClose}>
      <div className="mb-4 rounded-xl border border-raid-gold/30 bg-black/30 p-3">
        <div className="text-2xl">{boss?.sprite ?? '❓'}</div>
        <div className="font-semibold text-raid-gold">{boss?.nameZh ?? '未知 Boss'}</div>
        <p className="text-xs text-raid-muted">{boss?.uniqueSkill} · 每 10 波出現</p>
        <p className="mt-1 text-sm">
          {bossSoon ? 'Boss 臨近／進行中' : `下一 Boss：第 ${nextBossWave} 波`}
          {` · 已擊殺 ${player.bossKills}`}
        </p>
      </div>

      <div className="grid gap-2">
        {MAP_ORDER.map((id) => {
          const map = MAPS[id]
          const unlocked = player.unlockedMaps.includes(id)
          const here = player.currentMap === id
          return (
            <div key={id} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-3">
              <div>
                <div className="font-semibold" style={{ color: map.accent }}>{map.nameZh}</div>
                <div className="text-xs text-raid-muted">
                  難度 x{map.difficulty} · 解鎖波 {map.unlockWave}
                  {map.unlockPrestige ? ` · 轉生 ${map.unlockPrestige}` : ''}
                </div>
              </div>
              <GhostButton disabled={!unlocked || here} onClick={() => actions.travel(id)}>
                {here ? '目前' : unlocked ? '前往' : '未解鎖'}
              </GhostButton>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
