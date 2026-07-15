'use client'

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

export function Panel({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose?: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="flex max-h-[70svh] flex-col overflow-hidden rounded-2xl border border-white/10 bg-raid-panel/95 shadow-glow backdrop-blur"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="font-display text-lg font-bold text-raid-ink">{title}</h2>
        {onClose ? (
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm text-raid-muted hover:bg-white/5">
            關閉
          </button>
        ) : null}
      </div>
      <div className="overflow-y-auto p-3">{children}</div>
    </motion.div>
  )
}

export function StatPill({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'gold' | 'gem' }) {
  const color = tone === 'gold' ? 'text-raid-gold' : tone === 'gem' ? 'text-raid-gem' : 'text-raid-ink'
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-raid-muted">{label}</div>
      <div className={`font-display text-sm font-semibold ${color}`}>{value}</div>
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.97 }}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl bg-raid-accent px-3 py-2 text-sm font-semibold text-raid-bg disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {children}
    </motion.button>
  )
}

export function GhostButton({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.97 }}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-raid-ink disabled:opacity-40 ${className}`}
    >
      {children}
    </motion.button>
  )
}
