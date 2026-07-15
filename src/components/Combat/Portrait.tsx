'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { resolveHeroArt, resolveMonsterArt } from '@/data/art'
import { HeroArt, MonsterArt } from '@/components/Combat/CharacterArt'

type HeroPortraitProps = {
  skinId?: string | null
  attacking?: boolean
  hurt?: boolean
}

export function HeroPortrait({ skinId, attacking, hurt }: HeroPortraitProps) {
  const art = resolveHeroArt(skinId)
  const [failed, setFailed] = useState(false)

  if (failed) {
    return <HeroArt attacking={attacking} hurt={hurt} />
  }

  return (
    <motion.div
      className="relative h-40 w-28 overflow-hidden rounded-2xl sm:h-48 sm:w-36"
      animate={hurt ? { x: [-3, 3, -2, 0] } : attacking ? { x: [0, 10, 0] } : { y: [0, -4, 0] }}
      transition={hurt || attacking ? { duration: 0.28 } : { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="absolute inset-x-2 bottom-1 h-4 rounded-full bg-black/40 blur-[2px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={art.src}
        alt={art.label}
        className={`relative z-10 h-full w-full object-cover object-top ${skinId === 'ember' ? 'hue-rotate-[-18deg] saturate-125' : ''}`}
        draggable={false}
        onError={() => setFailed(true)}
      />
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/35 via-transparent to-white/5" />
    </motion.div>
  )
}

type EnemyPortraitProps = {
  name: string
  color: string
  defId: string
  isBoss?: boolean
  raging?: boolean
  hit?: boolean
}

export function EnemyPortrait({ name, color, defId, isBoss, raging, hit }: EnemyPortraitProps) {
  const src = resolveMonsterArt(defId, Boolean(isBoss))
  const [failed, setFailed] = useState(!src)

  if (!src || failed) {
    return <MonsterArt name={name} color={color} defId={defId} isBoss={isBoss} raging={raging} hit={hit} />
  }

  return (
    <motion.div
      className="relative h-40 w-28 overflow-hidden rounded-2xl sm:h-48 sm:w-36"
      style={{ boxShadow: `0 0 28px ${color}55` }}
      animate={
        hit
          ? { x: [0, -8, 4, 0] }
          : raging
            ? { scale: [1, 1.04, 1] }
            : { y: [0, -3, 0] }
      }
      transition={hit ? { duration: 0.3 } : raging ? { duration: 0.55, repeat: Infinity } : { duration: 2.3, repeat: Infinity }}
    >
      <div className="absolute inset-x-2 bottom-1 h-4 rounded-full bg-black/40 blur-[2px]" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={name}
        className="relative z-10 h-full w-full object-cover object-top"
        draggable={false}
        onError={() => setFailed(true)}
      />
      <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      {isBoss ? (
        <div className="absolute left-1/2 top-1 z-30 -translate-x-1/2 rounded-full bg-raid-gold/90 px-2 py-0.5 text-[10px] font-bold text-raid-bg">
          BOSS
        </div>
      ) : null}
    </motion.div>
  )
}
