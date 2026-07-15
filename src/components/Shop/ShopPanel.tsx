'use client'

import { SHOP_OFFERS } from '@/data/items'
import { useGame } from '@/game/GameProvider'
import { formatNumber } from '@/utils/math'
import { Panel, PrimaryButton } from '@/components/UI/Primitives'

export function ShopPanel({ onClose }: { onClose: () => void }) {
  const { player, actions } = useGame()
  return (
    <Panel title="商店" onClose={onClose}>
      <div className="grid gap-2">
        {SHOP_OFFERS.map((offer) => {
          const can =
            (offer.costGold == null || player.gold >= offer.costGold) &&
            (offer.costGems == null || player.gems >= offer.costGems)
          return (
            <div key={offer.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <div>
                <div className="font-semibold">{offer.name}</div>
                <div className="text-xs text-raid-muted">{offer.description}</div>
              </div>
              <PrimaryButton disabled={!can} onClick={() => actions.buyOffer(offer.id)}>
                {offer.costGold != null ? `${formatNumber(offer.costGold)}G` : ''}
                {offer.costGems != null ? ` ${offer.costGems}💎` : ''}
              </PrimaryButton>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
