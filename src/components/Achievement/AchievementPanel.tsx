'use client'

import { ACHIEVEMENTS } from '@/data/achievements'
import { useGame } from '@/game/GameProvider'
import { Panel } from '@/components/UI/Primitives'

export function AchievementPanel({ onClose }: { onClose: () => void }) {
  const { player } = useGame()
  return (
    <Panel title="成就" onClose={onClose}>
      <div className="grid gap-2">
        {ACHIEVEMENTS.map((def) => {
          const done = player.achievements.includes(def.id)
          return (
            <div key={def.id} className={`rounded-xl border p-3 ${done ? 'border-raid-gold/40 bg-raid-gold/10' : 'border-white/10 bg-black/20'}`}>
              <div className="font-semibold">{done ? '✓ ' : ''}{def.title}</div>
              <div className="text-xs text-raid-muted">{def.description}</div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
