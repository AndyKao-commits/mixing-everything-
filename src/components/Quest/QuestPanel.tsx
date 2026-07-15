'use client'

import { QUESTS } from '@/data/quests'
import { useGame } from '@/game/GameProvider'
import { Panel, PrimaryButton } from '@/components/UI/Primitives'

export function QuestPanel({ onClose }: { onClose: () => void }) {
  const { player, actions } = useGame()
  return (
    <Panel title="任務" onClose={onClose}>
      <div className="grid gap-2">
        {QUESTS.map((def) => {
          const progress = player.quests.find((q) => q.id === def.id)
          const pct = progress ? Math.min(100, Math.round((progress.progress / def.target) * 100)) : 0
          return (
            <div key={def.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] uppercase text-raid-muted">{def.type}</div>
                  <div className="font-semibold">{def.title}</div>
                  <div className="text-xs text-raid-muted">{def.description}</div>
                </div>
                <PrimaryButton
                  disabled={!progress?.completed || progress.claimed}
                  onClick={() => actions.claimQuest(def.id)}
                >
                  {progress?.claimed ? '已領' : '領獎'}
                </PrimaryButton>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/40">
                <div className="h-full bg-raid-accent" style={{ width: `${pct}%` }} />
              </div>
              <div className="mt-1 text-[11px] text-raid-muted">
                {progress?.progress ?? 0}/{def.target}
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
