'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { FX_ART } from '@/data/art'

type FxKind = keyof typeof FX_ART | 'crit' | 'hit'

export function CombatFxOverlay({ active }: { active: FxKind[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <AnimatePresence>
        {active.includes('slash') || active.includes('hit') ? (
          <motion.img
            key="slash"
            src={FX_ART.slash}
            alt=""
            initial={{ opacity: 0, scale: 0.7, rotate: -12 }}
            animate={{ opacity: [0, 1, 0], scale: [0.7, 1.15, 1.3], x: [20, -10] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            className="absolute left-[18%] top-[28%] h-28 w-28 object-contain mix-blend-screen sm:h-36 sm:w-36"
          />
        ) : null}
        {active.includes('crit') ? (
          <motion.img
            key="lightning"
            src={FX_ART.lightning}
            alt=""
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: [0, 1, 0], y: [-20, 10], scale: [0.8, 1.2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute right-[22%] top-[18%] h-32 w-32 object-contain mix-blend-screen"
          />
        ) : null}
        {active.includes('fire') ? (
          <motion.img
            key="fire"
            src={FX_ART.fire}
            alt=""
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.2, 1.4] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute right-[24%] top-[34%] h-24 w-24 object-contain mix-blend-screen"
          />
        ) : null}
      </AnimatePresence>
      {(active.includes('crit') || active.includes('hit')) && (
        <motion.div
          key="flash"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.25, 0] }}
          transition={{ duration: 0.28 }}
          className="absolute inset-0 bg-white"
        />
      )}
    </div>
  )
}
