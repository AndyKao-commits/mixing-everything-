'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { MAPS } from '@/data/maps'
import { useGame } from '@/game/GameProvider'
import { formatNumber } from '@/utils/math'
import { GhostButton, PrimaryButton, StatPill } from '@/components/UI/Primitives'
import { RARITY_COLOR } from '@/data/rarity'

const FLOAT_COLOR: Record<string, string> = {
  white: '#f5f7f6',
  yellow: '#ffe566',
  orange: '#ffb347',
  red: '#ff5a4a',
  green: '#5bd67a',
  cyan: '#7ec8ff',
}

export function TopBar() {
  const { player, stats } = useGame()
  const map = MAPS[player.currentMap]
  const xpPct = Math.min(100, Math.round((player.exp / (40 + player.level * 28 + player.level * player.level * 3.2)) * 100))
  const hpPct = Math.min(100, Math.round((player.hp / stats.maxHp) * 100))

  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatPill label="Gold" value={formatNumber(player.gold)} tone="gold" />
        <StatPill label="Gems" value={formatNumber(player.gems)} tone="gem" />
        <StatPill label="Level" value={`Lv.${player.level}`} />
        <StatPill label="Wave" value={`${player.currentWave} · ${map.nameZh}`} />
      </div>
      <div className="grid gap-1">
        <div className="flex justify-between text-xs text-raid-muted">
          <span>HP {Math.ceil(player.hp)}/{stats.maxHp}</span>
          <span>Combo x{player.combo}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black/40">
          <motion.div className="h-full bg-raid-danger" animate={{ width: `${hpPct}%` }} />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-black/40">
          <motion.div className="h-full bg-raid-gem" animate={{ width: `${xpPct}%` }} />
        </div>
      </div>
    </div>
  )
}

export function BattleScene() {
  const { player, stats, runtime, actions, offlineGold, claimOffline } = useGame()
  const map = MAPS[player.currentMap]
  const enemy = runtime.enemy
  const shaking = runtime.fx.some((fx) => fx.type === 'shake')
  const enemyHp = enemy ? Math.round((enemy.hp / enemy.maxHp) * 100) : 0

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10" style={{ background: `linear-gradient(180deg, ${map.bgFrom}, ${map.bgTo})` }}>
      <div className={`relative min-h-[320px] p-4 sm:min-h-[380px] ${shaking ? 'animate-shake' : ''}`}>
        <div className="mb-3 flex items-center justify-between text-xs text-white/70">
          <span>{map.nameZh}</span>
          <span>ATK {Math.round(stats.attack)} · ASPD {stats.attackSpeed.toFixed(2)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <motion.div layout className="flex flex-col items-center gap-2 rounded-2xl bg-black/25 p-3">
            <div className="text-4xl">🗡️</div>
            <div className="font-semibold">巡衛</div>
            <div className="w-full h-2 rounded-full bg-black/40 overflow-hidden">
              <div className="h-full bg-raid-accent" style={{ width: `${Math.min(100, (player.hp / stats.maxHp) * 100)}%` }} />
            </div>
          </motion.div>

          <motion.div
            key={enemy?.id ?? 'empty'}
            initial={{ opacity: 0, x: 24, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: enemy?.raging ? 1.08 : 1 }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-black/25 p-3"
            style={{ boxShadow: enemy ? `0 0 24px ${enemy.color}55` : undefined }}
          >
            <div className="text-4xl">{enemy?.sprite ?? '…'}</div>
            <div className="text-center font-semibold">
              {enemy?.name ?? '搜尋敵人'}
              {enemy?.isBoss ? <span className="ml-1 text-raid-gold">BOSS</span> : null}
              {enemy?.raging ? <span className="ml-1 text-raid-danger">RAGE</span> : null}
              {enemy?.phase === 2 ? <span className="ml-1 text-raid-mythic">P2</span> : null}
            </div>
            {enemy ? (
              <div className="w-full">
                <div className="mb-1 flex justify-between text-[10px] text-white/70">
                  <span style={{ color: RARITY_COLOR[enemy.rarity] }}>{enemy.rarity}</span>
                  <span>
                    {Math.ceil(enemy.hp)}/{enemy.maxHp}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/40">
                  <motion.div className="h-full" style={{ background: enemy.color }} animate={{ width: `${enemyHp}%` }} />
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <AnimatePresence>
            {runtime.floating.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 1, y: 0, scale: 0.9 }}
                animate={{ opacity: 0, y: -50, scale: 1.15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85 }}
                className="absolute font-display text-lg font-black drop-shadow"
                style={{ left: `${f.x}%`, top: `${f.y}%`, color: FLOAT_COLOR[f.color] }}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {player.hp <= 0 ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/70">
            <p className="text-xl font-bold">你倒下了</p>
            <PrimaryButton onClick={actions.revive}>復活並繼續</PrimaryButton>
          </div>
        ) : null}

        {offlineGold > 0 && !runtime.offlineClaimed ? (
          <div className="absolute inset-x-3 top-3 z-20 rounded-xl border border-raid-gold/30 bg-black/70 p-3">
            <p className="text-sm">離線收益 +{formatNumber(offlineGold)} 金幣</p>
            <PrimaryButton className="mt-2" onClick={claimOffline}>
              領取
            </PrimaryButton>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-white/10 bg-black/30 p-3 sm:grid-cols-4">
        <PrimaryButton onClick={actions.castSkill}>
          必殺 {runtime.skillCd.burst > 0 ? `${runtime.skillCd.burst.toFixed(1)}s` : '就緒'}
        </PrimaryButton>
        <GhostButton onClick={actions.drinkPotion}>藥劑 ×{player.potions}</GhostButton>
        <GhostButton onClick={actions.toggleAuto}>{player.autoBattle ? '自動：開' : '自動：關'}</GhostButton>
        <GhostButton onClick={actions.save}>儲存</GhostButton>
      </div>
    </div>
  )
}
