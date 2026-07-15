'use client'

import { UPGRADES } from '@/data/upgrades'
import { useGame } from '@/game/GameProvider'
import { upgradeCost } from '@/systems/UpgradeSystem'
import { formatNumber } from '@/utils/math'
import { Panel, PrimaryButton } from '@/components/UI/Primitives'

export function UpgradePanel({ onClose }: { onClose: () => void }) {
  const { player, actions } = useGame()
  return (
    <Panel title="永久強化" onClose={onClose}>
      <div className="grid gap-2">
        {UPGRADES.map((def) => {
          const level = player.upgrades[def.id]
          const cost = upgradeCost(def.id, level)
          return (
            <div key={def.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <div>
                <div className="font-semibold">{def.name}</div>
                <div className="text-xs text-raid-muted">{def.description} · Lv.{level}/{def.maxLevel}</div>
              </div>
              <PrimaryButton disabled={player.gold < cost || level >= def.maxLevel} onClick={() => actions.buyUpgrade(def.id)}>
                {formatNumber(cost)} G
              </PrimaryButton>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
