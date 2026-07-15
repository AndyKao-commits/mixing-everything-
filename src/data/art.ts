/**
 * Art pipeline registry — drop WebP into public/art and map ids here.
 * Battle UI prefers raster art; falls back to SVG when missing.
 */

export type ArtKind = 'hero' | 'monster' | 'boss' | 'fx'

export type ArtEntry = {
  id: string
  kind: ArtKind
  src: string
  label: string
  skin?: string
}

export const HERO_SKINS: ArtEntry[] = [
  { id: 'warden', kind: 'hero', src: '/art/heroes/warden.webp', label: '霧林巡衛', skin: 'default' },
  { id: 'warden-ember', kind: 'hero', src: '/art/heroes/warden.webp', label: '餘燼巡衛', skin: 'ember' },
  { id: 'assassin', kind: 'hero', src: '/art/heroes/assassin.webp', label: '影刃刺客', skin: 'assassin' },
  { id: 'mage', kind: 'hero', src: '/art/heroes/mage.webp', label: '奧術法師', skin: 'mage' },
  { id: 'tank', kind: 'hero', src: '/art/heroes/tank.webp', label: '鐵壁坦克', skin: 'tank' },
]

/** Monster defId → art path. Aliases share base art where needed. */
export const MONSTER_ART: Record<string, string> = {
  slime: '/art/monsters/slime.webp',
  'wolf-pup': '/art/monsters/wolf.webp',
  wolf: '/art/monsters/wolf.webp',
  'ice-wolf': '/art/monsters/wolf.webp',
  bandit: '/art/monsters/bandit.webp',
  'frost-bandit': '/art/monsters/bandit.webp',
  'sky-pirate': '/art/monsters/bandit.webp',
  goblin: '/art/monsters/goblin.webp',
  'goblin-archer': '/art/monsters/goblin.webp',
  'goblin-raid-captain': '/art/monsters/goblin.webp',
  skeleton: '/art/monsters/skeleton.webp',
  'royal-guard': '/art/monsters/skeleton.webp',
  'ash-knight': '/art/monsters/skeleton.webp',
  'golem-knight': '/art/monsters/golem.webp',
  'rock-golem': '/art/monsters/golem.webp',
  'lava-golem': '/art/monsters/golem.webp',
  harpy: '/art/monsters/harpy.webp',
  bat: '/art/monsters/harpy.webp',
  stirge: '/art/monsters/harpy.webp',
  'cave-spider': '/art/monsters/spider.webp',
  'ash-imp': '/art/monsters/imp.webp',
  demonling: '/art/monsters/imp.webp',
  hellhound: '/art/monsters/hellhound.webp',
  wraith: '/art/monsters/wraith.webp',
  'void-spawn': '/art/monsters/wraith.webp',
  spriggan: '/art/monsters/slime.webp',
  'treant-sapling': '/art/monsters/golem.webp',
  'yeti-cub': '/art/monsters/wolf.webp',
  'ice-elemental': '/art/monsters/wraith.webp',
  'magma-slug': '/art/monsters/slime.webp',
  'fire-serpent': '/art/monsters/hellhound.webp',
  'cloud-drake': '/art/monsters/harpy.webp',
  'storm-spirit': '/art/monsters/wraith.webp',
  'cursed-noble': '/art/monsters/bandit.webp',
}

export const BOSS_ART: Record<string, string> = {
  'grove-tyrant': '/art/bosses/grove-tyrant.webp',
  'forest-wraith': '/art/bosses/forest-wraith.webp',
  'crystal-behemoth': '/art/bosses/crystal-behemoth.webp',
  'glacier-king': '/art/bosses/glacier-king.webp',
  'magma-hydra': '/art/bosses/magma-hydra.webp',
  'storm-seraph': '/art/bosses/storm-seraph.webp',
  'abyss-overlord': '/art/bosses/abyss-overlord.webp',
  'fallen-monarch': '/art/bosses/fallen-monarch.webp',
}

export const FX_ART = {
  slash: '/art/fx/slash.webp',
  fire: '/art/fx/fire.webp',
  lightning: '/art/fx/lightning.webp',
} as const

export function resolveHeroArt(skinId?: string | null): ArtEntry {
  const skin = skinId || 'default'
  return HERO_SKINS.find((entry) => entry.skin === skin) ?? HERO_SKINS[0]!
}

export function resolveMonsterArt(defId: string, isBoss: boolean): string | null {
  if (isBoss && BOSS_ART[defId]) return BOSS_ART[defId]!
  if (MONSTER_ART[defId]) return MONSTER_ART[defId]!
  return null
}

export const ART_BACKLOG = [
  'optional: unique art per remaining alias (goblin-archer, lava-golem, …)',
  'optional: spine/lottie idle loops',
  'optional: map background plates',
] as const
