'use client'

import { useMemo, useState } from 'react'
import { RARITY_COLOR, RARITY_LABEL } from '@/data/rarity'
import { EFFECT_LABEL } from '@/data/weapons'
import { useGame } from '@/game/GameProvider'
import { sellValue } from '@/systems/LootSystem'
import { Panel, GhostButton, PrimaryButton } from '@/components/UI/Primitives'
import type { EquipmentItem, Rarity } from '@/types/game'

export function InventoryPanel({ onClose }: { onClose: () => void }) {
  const { player, actions } = useGame()
  const [q, setQ] = useState('')
  const [rarity, setRarity] = useState<Rarity | 'all'>('all')
  const [onlyFav, setOnlyFav] = useState(false)

  const items = useMemo(() => {
    return player.inventory
      .filter((item) => (rarity === 'all' ? true : item.rarity === rarity))
      .filter((item) => (onlyFav ? item.favorite : true))
      .filter((item) => item.name.includes(q) || item.slot.includes(q))
      .sort((a, b) => Number(b.favorite) - Number(a.favorite) || b.attack + b.defense - (a.attack + a.defense))
  }, [player.inventory, q, rarity, onlyFav])

  const equipped = Object.values(player.equipment).filter(Boolean) as EquipmentItem[]

  return (
    <Panel title="背包 / 裝備" onClose={onClose}>
      <div className="mb-3 grid gap-2">
        <div className="text-xs text-raid-muted">已裝備</div>
        <div className="grid gap-2 sm:grid-cols-2">
          {(['weapon', 'armor', 'ring', 'amulet'] as const).map((slot) => {
            const item = player.equipment[slot]
            return (
              <div key={slot} className="rounded-xl border border-white/10 bg-black/20 p-2 text-sm">
                <div className="text-[10px] uppercase text-raid-muted">{slot}</div>
                {item ? (
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ color: RARITY_COLOR[item.rarity] }}>{item.name}+{item.level}</span>
                    <GhostButton onClick={() => actions.unequip(slot)}>卸下</GhostButton>
                  </div>
                ) : (
                  <span className="text-raid-muted">空</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋"
          className="rounded-lg border-white/10 bg-black/30 text-sm"
        />
        <select value={rarity} onChange={(e) => setRarity(e.target.value as Rarity | 'all')} className="rounded-lg border-white/10 bg-black/30 text-sm">
          <option value="all">全部稀有度</option>
          {Object.entries(RARITY_LABEL).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
        <GhostButton onClick={() => setOnlyFav((v) => !v)}>{onlyFav ? '只看收藏：開' : '只看收藏：關'}</GhostButton>
      </div>

      <div className="grid gap-2">
        {items.length === 0 ? <p className="text-sm text-raid-muted">沒有符合的裝備</p> : null}
        {items.map((item) => (
          <div key={item.uid} className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-semibold" style={{ color: RARITY_COLOR[item.rarity] }}>
                  {item.favorite ? '★ ' : ''}{item.name} +{item.level} {item.locked ? '🔒' : ''}
                </div>
                <div className="text-xs text-raid-muted">
                  {RARITY_LABEL[item.rarity]} · ATK {item.attack} · DEF {item.defense}
                  {item.effect ? ` · ${EFFECT_LABEL[item.effect]}` : ''} · 賣 {sellValue(item)}G
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <PrimaryButton onClick={() => actions.equip(item.uid)}>裝備</PrimaryButton>
                <GhostButton onClick={() => actions.favorite(item.uid)}>收藏</GhostButton>
                <GhostButton onClick={() => actions.lock(item.uid)}>鎖定</GhostButton>
                <GhostButton disabled={item.locked} onClick={() => actions.sell(item.uid)}>出售</GhostButton>
                <GhostButton onClick={() => actions.forgeUpgrade(item.uid)}>強化</GhostButton>
                <GhostButton onClick={() => actions.forgeEnchant(item.uid)}>附魔</GhostButton>
                <GhostButton onClick={() => actions.forgeReforge(item.uid)}>重鑄</GhostButton>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-raid-muted">
        材料：{player.materials.map((m) => `${m.id} ${m.qty}`).join(' · ')}
        {equipped.length ? ` · 已裝 ${equipped.length}` : ''}
      </div>
    </Panel>
  )
}
