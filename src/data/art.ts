/**
 * Next-stage art pipeline registry.
 * Drop PNGs into public/art/{heroes|monsters|bosses}/ and map them here.
 * Battle UI prefers raster art; falls back to SVG illustrations when missing.
 */

export type ArtKind = 'hero' | 'monster' | 'boss'

export type ArtEntry = {
  id: string
  kind: ArtKind
  /** Public URL under /art/... */
  src: string
  label: string
  /** Optional skin / palette tag for future costumes */
  skin?: string
}

export const HERO_SKINS: ArtEntry[] = [
  {
    id: 'warden',
    kind: 'hero',
    src: '/art/heroes/warden.webp',
    label: '霧林巡衛',
    skin: 'default',
  },
  {
    id: 'warden-ember',
    kind: 'hero',
    src: '/art/heroes/warden.webp',
    label: '餘燼巡衛',
    skin: 'ember',
  },
]

/** Monster defId → art path. Unlisted ids use SVG fallback. */
export const MONSTER_ART: Record<string, string> = {
  goblin: '/art/monsters/goblin.webp',
  'goblin-archer': '/art/monsters/goblin.webp',
  'goblin-raid-captain': '/art/monsters/goblin.webp',
}

export const BOSS_ART: Record<string, string> = {
  'grove-tyrant': '/art/bosses/grove-tyrant.webp',
}

export function resolveHeroArt(skinId?: string | null): ArtEntry {
  const skin = skinId || 'default'
  return HERO_SKINS.find((entry) => entry.skin === skin) ?? HERO_SKINS[0]!
}

export function resolveMonsterArt(defId: string, isBoss: boolean): string | null {
  if (isBoss && BOSS_ART[defId]) return BOSS_ART[defId]!
  if (MONSTER_ART[defId]) return MONSTER_ART[defId]!
  if (isBoss) return null
  return null
}

/** Checklist for expanding the art pack (stage 2+). */
export const ART_BACKLOG = [
  'heroes: assassin / mage / tank variants',
  'monsters: wolf, skeleton, slime, orc, harpy',
  'bosses: one PNG per map boss',
  'fx: slash / fire / lightning overlay sheets',
  'optional: spine/lottie idle loops',
] as const
