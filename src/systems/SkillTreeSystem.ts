import { SKILLS } from '@/data/skills'
import type { Player, SkillDef } from '@/types/game'

export function canUnlockSkill(player: Player, skill: SkillDef) {
  if (player.unlockedSkills.includes(skill.id)) return false
  if (player.skillPoints < skill.cost) return false
  if (skill.classId !== player.skillClass) return false
  if (skill.requires?.some((id) => !player.unlockedSkills.includes(id))) return false
  return true
}

export function unlockSkill(player: Player, skillId: string): Player | null {
  const skill = SKILLS.find((entry) => entry.id === skillId)
  if (!skill || !canUnlockSkill(player, skill)) return null
  const e = skill.effect
  return {
    ...player,
    skillPoints: player.skillPoints - skill.cost,
    unlockedSkills: [...player.unlockedSkills, skill.id],
    attack: player.attack + (e.attack ?? 0),
    defense: player.defense + (e.defense ?? 0),
    maxHp: player.maxHp + (e.maxHp ?? 0),
    hp: player.hp + (e.maxHp ?? 0),
    critChance: player.critChance + (e.critChance ?? 0),
    critDamage: player.critDamage + (e.critDamage ?? 0),
    attackSpeed: player.attackSpeed + (e.attackSpeed ?? 0),
    goldMultiplier: player.goldMultiplier + (e.goldMultiplier ?? 0),
    dropMultiplier: player.dropMultiplier + (e.dropMultiplier ?? 0),
    expMultiplier: player.expMultiplier + (e.expMultiplier ?? 0),
    bossDamageBonus: player.bossDamageBonus + (e.bossDamageBonus ?? 0),
  }
}

export function getUnlockedSkillEffects(player: Player) {
  return SKILLS.filter((skill) => player.unlockedSkills.includes(skill.id)).map((s) => s.effect)
}
