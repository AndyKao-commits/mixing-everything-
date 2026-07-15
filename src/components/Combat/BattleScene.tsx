'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { MAPS } from '@/data/maps'
import { useGame } from '@/game/GameProvider'
import { formatNumber } from '@/utils/math'
import { GhostButton, PrimaryButton, StatPill } from '@/components/UI/Primitives'
import { RARITY_COLOR, RARITY_LABEL } from '@/data/rarity'
import { HeroPortrait, EnemyPortrait } from '@/components/Combat/Portrait'

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
  const hitFx = runtime.fx.some((fx) => fx.type === 'hit' || fx.type === 'crit')
  const hurtFx = runtime.fx.some((fx) => fx.type === 'shake' && player.combo === 0)
  const enemyHp = enemy ? Math.round((enemy.hp / enemy.maxHp) * 100) : 0
  const playerHp = Math.min(100, (player.hp / stats.maxHp) * 100)

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10">
      {/* Full-bleed battlefield */}
      <div
        className={`relative min-h-[360px] sm:min-h-[420px] ${shaking ? 'animate-shake' : ''}`}
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, ${map.accent}33, transparent 55%),
            linear-gradient(180deg, ${map.bgFrom} 0%, ${map.bgTo} 55%, #050a08 100%)
          `,
        }}
      >
        {/* Atmosphere layers */}
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(circle at center, black 20%, transparent 75%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40"
          style={{
            background: `linear-gradient(180deg, transparent, ${map.bgTo}cc 40%, #030705)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-16 h-24 opacity-50"
          style={{
            background: `radial-gradient(ellipse at center, ${map.accent}44, transparent 70%)`,
          }}
        />

        <div className="relative z-10 flex items-center justify-between px-4 pt-3 text-xs text-white/75">
          <span className="rounded-full bg-black/35 px-2 py-1 backdrop-blur">{map.nameZh}</span>
          <span className="rounded-full bg-black/35 px-2 py-1 backdrop-blur">
            ATK {Math.round(stats.attack)} · ASPD {stats.attackSpeed.toFixed(2)}
          </span>
        </div>

        {/* Stage: characters face each other, not boxed cards */}
        <div className="relative z-10 grid grid-cols-2 items-end gap-2 px-2 pb-6 pt-4 sm:gap-6 sm:px-6">
          <div className="flex flex-col items-center">
            <HeroPortrait skinId={player.heroSkin} attacking={hitFx} hurt={hurtFx} />
            <p className="mt-1 font-display text-sm font-bold tracking-wide text-raid-ink">巡衛</p>
            <div className="mt-2 w-full max-w-[140px]">
              <div className="mb-1 flex justify-between text-[10px] text-white/70">
                <span>你</span>
                <span>
                  {Math.ceil(player.hp)}/{stats.maxHp}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-700 to-raid-accent" animate={{ width: `${playerHp}%` }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={enemy?.id ?? 'empty'}
                initial={{ opacity: 0, x: 30, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20 }}
                className="flex flex-col items-center"
              >
                {enemy ? (
                  <EnemyPortrait
                    name={enemy.name}
                    color={enemy.color}
                    defId={enemy.defId}
                    isBoss={enemy.isBoss}
                    raging={enemy.raging}
                    hit={hitFx}
                  />
                ) : (
                  <div className="flex h-40 w-28 items-center justify-center text-raid-muted sm:h-48 sm:w-36">搜尋中…</div>
                )}
                <p className="mt-1 text-center font-display text-sm font-bold">
                  {enemy?.name ?? '—'}
                  {enemy?.isBoss ? <span className="ml-1 text-raid-gold">BOSS</span> : null}
                  {enemy?.raging ? <span className="ml-1 text-raid-danger">RAGE</span> : null}
                  {enemy?.phase === 2 ? <span className="ml-1 text-raid-mythic">P2</span> : null}
                </p>
                {enemy ? (
                  <div className="mt-2 w-full max-w-[140px]">
                    <div className="mb-1 flex justify-between text-[10px] text-white/70">
                      <span style={{ color: RARITY_COLOR[enemy.rarity] }}>{RARITY_LABEL[enemy.rarity]}</span>
                      <span>
                        {Math.ceil(enemy.hp)}/{enemy.maxHp}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-black/50 ring-1 ring-white/10">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${enemy.color}, #fff6)` }}
                        animate={{ width: `${enemyHp}%` }}
                      />
                    </div>
                  </div>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <AnimatePresence>
            {runtime.floating.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 1, y: 0, scale: 0.9 }}
                animate={{ opacity: 0, y: -56, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.85 }}
                className="absolute font-display text-lg font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{ left: `${f.x}%`, top: `${f.y}%`, color: FLOAT_COLOR[f.color] }}
              >
                {f.text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {player.hp <= 0 ? (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-black/75">
            <p className="text-xl font-bold">你倒下了</p>
            <PrimaryButton onClick={actions.revive}>復活並繼續</PrimaryButton>
          </div>
        ) : null}

        {offlineGold > 0 && !runtime.offlineClaimed ? (
          <div className="absolute inset-x-3 top-12 z-30 rounded-xl border border-raid-gold/30 bg-black/75 p-3 backdrop-blur">
            <p className="text-sm">離線收益 +{formatNumber(offlineGold)} 金幣</p>
            <PrimaryButton className="mt-2" onClick={claimOffline}>
              領取
            </PrimaryButton>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-white/10 bg-black/40 p-3 sm:grid-cols-4">
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
