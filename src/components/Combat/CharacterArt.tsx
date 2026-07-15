'use client'

import { motion } from 'framer-motion'

/** Illustrated combat portraits — SVG “design sheet” style, no emoji. */

export function HeroArt({ attacking = false, hurt = false }: { attacking?: boolean; hurt?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 160 200"
      className="h-36 w-28 sm:h-44 sm:w-36"
      animate={hurt ? { x: [-3, 3, -2, 0] } : attacking ? { x: [0, 8, 0] } : { y: [0, -3, 0] }}
      transition={hurt || attacking ? { duration: 0.28 } : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="heroCloak" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2f7a55" />
          <stop offset="100%" stopColor="#123528" />
        </linearGradient>
        <linearGradient id="heroArmor" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4fb87f" />
          <stop offset="100%" stopColor="#1d5a3f" />
        </linearGradient>
        <linearGradient id="heroBlade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9aa7b5" />
          <stop offset="55%" stopColor="#f4f7fb" />
          <stop offset="100%" stopColor="#7d8a98" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="185" rx="34" ry="8" fill="rgba(0,0,0,0.35)" />
      <path d="M48 92 C40 120 36 160 44 178 L116 178 C124 160 118 120 110 92 Z" fill="url(#heroCloak)" />
      <path d="M58 88 H102 L108 148 H52 Z" fill="url(#heroArmor)" />
      <rect x="76" y="92" width="6" height="48" rx="2" fill="#d7c28a" />
      <rect x="60" y="100" width="38" height="8" rx="3" fill="#e4572e" />
      <circle cx="80" cy="58" r="22" fill="#f2d4a8" />
      <path d="M58 48 H102 V58 Q80 66 58 58 Z" fill="#c9d2da" />
      <path d="M86 28 C96 20 112 30 104 42 C96 36 90 36 86 40 Z" fill="#e4572e" />
      <circle cx="72" cy="60" r="2.2" fill="#13241f" />
      <circle cx="90" cy="60" r="2.2" fill="#13241f" />
      <path d="M74 68 Q80 72 86 68" stroke="#c4896a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="112" y="108" width="8" height="14" rx="2" fill="#8a5a2b" />
      <path d="M116 80 L118 108 L122 108 L124 80 Z" fill="url(#heroBlade)" />
      <rect x="64" y="148" width="12" height="28" rx="3" fill="#2a2218" />
      <rect x="84" y="148" width="12" height="28" rx="3" fill="#2a2218" />
      <rect x="62" y="172" width="16" height="8" rx="2" fill="#8a5a2b" />
      <rect x="82" y="172" width="16" height="8" rx="2" fill="#8a5a2b" />
    </motion.svg>
  )
}

type MonsterArtProps = {
  name: string
  color: string
  defId: string
  isBoss?: boolean
  raging?: boolean
  hit?: boolean
}

export function MonsterArt({ name, color, defId, isBoss, raging, hit }: MonsterArtProps) {
  const kind = classify(defId)
  return (
    <motion.svg
      viewBox="0 0 160 200"
      className="h-36 w-28 sm:h-44 sm:w-36"
      animate={
        hit
          ? { x: [0, -8, 4, 0], filter: ['brightness(1)', 'brightness(1.4)', 'brightness(1)'] }
          : raging
            ? { scale: [1, 1.04, 1], rotate: [0, -1.5, 1.5, 0] }
            : { y: [0, -2, 0] }
      }
      transition={hit ? { duration: 0.3 } : raging ? { duration: 0.6, repeat: Infinity } : { duration: 2.2, repeat: Infinity }}
      aria-label={name}
    >
      <defs>
        <linearGradient id={`mon-${defId}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#121816" />
        </linearGradient>
        <radialGradient id={`glow-${defId}`} cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.55" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="80" cy="185" rx={isBoss ? 42 : 32} ry="8" fill="rgba(0,0,0,0.4)" />
      <circle cx="80" cy="110" r={isBoss ? 70 : 56} fill={`url(#glow-${defId})`} />
      {kind === 'beast' ? <BeastBody colorId={`mon-${defId}`} color={color} /> : null}
      {kind === 'undead' ? <UndeadBody colorId={`mon-${defId}`} color={color} /> : null}
      {kind === 'flyer' ? <FlyerBody colorId={`mon-${defId}`} color={color} /> : null}
      {kind === 'humanoid' ? <HumanoidBody colorId={`mon-${defId}`} color={color} boss={isBoss} /> : null}
      {isBoss ? <path d="M56 28 L80 12 L104 28 L96 34 L80 22 L64 34 Z" fill="#f0c14b" /> : null}
    </motion.svg>
  )
}

function classify(defId: string): 'beast' | 'undead' | 'flyer' | 'humanoid' {
  if (/wolf|bear|rat|hound|spider|serpent|slug|drake|boar|yeti/.test(defId)) return 'beast'
  if (/skeleton|zombie|wraith|golem|behemoth/.test(defId)) return 'undead'
  if (/harpy|bat|stirge|spirit|seraph|imp/.test(defId)) return 'flyer'
  return 'humanoid'
}

function HumanoidBody({ colorId, color, boss }: { colorId: string; color: string; boss?: boolean }) {
  return (
    <g>
      <ellipse cx="80" cy="128" rx={boss ? 42 : 34} ry={boss ? 48 : 40} fill={`url(#${colorId})`} />
      <circle cx="80" cy="62" r={boss ? 28 : 24} fill={`url(#${colorId})`} />
      <path d="M54 48 L44 28 L60 42" fill={color} />
      <path d="M106 48 L116 28 L100 42" fill={color} />
      <circle cx="70" cy="60" r="4" fill="#13241f" />
      <circle cx="90" cy="60" r="4" fill="#13241f" />
      <circle cx="71" cy="59" r="1.4" fill="#ffe566" />
      <circle cx="91" cy="59" r="1.4" fill="#ffe566" />
      <path d="M68 74 Q80 84 92 74" stroke="#1a120e" strokeWidth="3" fill="none" />
      <path d="M72 72 L76 78 L70 78 Z" fill="#f0d7a8" />
      <path d="M88 72 L84 78 L90 78 Z" fill="#f0d7a8" />
      <rect x="48" y="110" width="14" height="36" rx="6" fill={color} opacity="0.85" />
      <rect x="98" y="110" width="14" height="36" rx="6" fill={color} opacity="0.85" />
    </g>
  )
}

function BeastBody({ colorId, color }: { colorId: string; color: string }) {
  return (
    <g>
      <ellipse cx="84" cy="120" rx="46" ry="34" fill={`url(#${colorId})`} />
      <ellipse cx="52" cy="88" rx="28" ry="24" fill={`url(#${colorId})`} />
      <path d="M34 72 L28 48 L46 66" fill={color} />
      <path d="M52 68 L58 46 L66 68" fill={color} />
      <circle cx="42" cy="84" r="3.5" fill="#13241f" />
      <circle cx="43" cy="83" r="1.2" fill="#fff" />
      <ellipse cx="28" cy="94" rx="10" ry="6" fill="#2a2018" />
      <path d="M60 148 L52 176 L66 168" fill={color} />
      <path d="M100 148 L108 176 L92 168" fill={color} />
      <path d="M118 118 Q140 100 128 128" stroke={color} strokeWidth="8" fill="none" strokeLinecap="round" />
    </g>
  )
}

function UndeadBody({ colorId, color }: { colorId: string; color: string }) {
  return (
    <g>
      <rect x="56" y="86" width="48" height="70" rx="8" fill={`url(#${colorId})`} />
      <circle cx="80" cy="60" r="26" fill="#e8eef2" />
      <rect x="66" y="54" width="8" height="8" fill="#7cf0ff" />
      <rect x="86" y="54" width="8" height="8" fill="#7cf0ff" />
      <path d="M68 72 H92" stroke="#8a96a0" strokeWidth="3" />
      <rect x="48" y="100" width="10" height="40" fill={color} opacity="0.7" />
      <rect x="102" y="100" width="10" height="40" fill={color} opacity="0.7" />
      <path d="M64 156 L60 180 L72 170" fill="#dfe6ec" />
      <path d="M96 156 L100 180 L88 170" fill="#dfe6ec" />
    </g>
  )
}

function FlyerBody({ colorId, color }: { colorId: string; color: string }) {
  return (
    <g>
      <path d="M30 100 Q10 70 46 88 Q60 100 30 100" fill={color} opacity="0.9" />
      <path d="M130 100 Q150 70 114 88 Q100 100 130 100" fill={color} opacity="0.9" />
      <ellipse cx="80" cy="110" rx="28" ry="36" fill={`url(#${colorId})`} />
      <circle cx="80" cy="70" r="22" fill={`url(#${colorId})`} />
      <circle cx="72" cy="68" r="3.5" fill="#13241f" />
      <circle cx="90" cy="68" r="3.5" fill="#13241f" />
      <path d="M70 80 Q80 86 90 80" stroke="#1a120e" strokeWidth="2" fill="none" />
      <path d="M80 46 L86 28 L74 28 Z" fill="#e4572e" />
    </g>
  )
}
