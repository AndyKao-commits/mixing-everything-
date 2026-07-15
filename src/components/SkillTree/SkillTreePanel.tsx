'use client'

import { SKILL_CLASSES, skillsForClass } from '@/data/skills'
import { useGame } from '@/game/GameProvider'
import { canUnlockSkill } from '@/systems/SkillTreeSystem'
import { Panel, GhostButton, PrimaryButton } from '@/components/UI/Primitives'

export function SkillTreePanel({ onClose }: { onClose: () => void }) {
  const { player, actions } = useGame()
  const skills = skillsForClass(player.skillClass)

  return (
    <Panel title="技能樹" onClose={onClose}>
      <div className="mb-3 flex flex-wrap gap-2">
        {SKILL_CLASSES.map((c) => (
          <GhostButton key={c.id} className={player.skillClass === c.id ? 'border-raid-accent' : ''} onClick={() => actions.setClass(c.id)}>
            {c.name}
          </GhostButton>
        ))}
      </div>
      <p className="mb-2 text-sm text-raid-muted">技能點：{player.skillPoints}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {skills.map((skill) => {
          const unlocked = player.unlockedSkills.includes(skill.id)
          const can = canUnlockSkill(player, skill)
          return (
            <div key={skill.id} className={`rounded-xl border p-3 ${unlocked ? 'border-raid-accent/50 bg-raid-accent/10' : 'border-white/10 bg-black/20'}`}>
              <div className="font-semibold">{skill.name}</div>
              <div className="text-xs text-raid-muted">{skill.description}</div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs">消耗 {skill.cost} · 階 {skill.tier}</span>
                <PrimaryButton disabled={unlocked || !can} onClick={() => actions.unlockSkill(skill.id)}>
                  {unlocked ? '已學' : '解鎖'}
                </PrimaryButton>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
