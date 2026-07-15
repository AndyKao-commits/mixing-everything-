'use client'

import { useGame, usePrestigeInfo } from '@/game/GameProvider'
import { Panel, GhostButton, PrimaryButton } from '@/components/UI/Primitives'

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const { player, actions } = useGame()
  const prestige = usePrestigeInfo()
  const s = player.settings

  return (
    <Panel title="設定 / 轉生" onClose={onClose}>
      <div className="grid gap-2">
        {(
          [
            ['sound', '音效'],
            ['music', '音樂'],
            ['damageNumbers', '傷害數字'],
            ['autoSave', '自動存檔'],
            ['darkMode', '深色模式'],
          ] as const
        ).map(([key, label]) => (
          <GhostButton key={key} onClick={() => actions.patchSettings({ [key]: !s[key] })}>
            {label}：{s[key] ? '開' : '關'}
          </GhostButton>
        ))}
        <GhostButton onClick={() => actions.patchSettings({ fps: s.fps === 60 ? 30 : 60 })}>
          FPS：{s.fps}
        </GhostButton>
        <GhostButton
          onClick={() =>
            actions.patchSettings({
              graphicQuality: s.graphicQuality === 'high' ? 'medium' : s.graphicQuality === 'medium' ? 'low' : 'high',
            })
          }
        >
          畫質：{s.graphicQuality}
        </GhostButton>
        <GhostButton onClick={() => actions.patchSettings({ language: s.language === 'zh' ? 'en' : 'zh' })}>
          語言：{s.language}
        </GhostButton>
        <GhostButton
          onClick={() =>
            actions.setHeroSkin(
              player.heroSkin === 'ember'
                ? 'default'
                : player.achievements.includes('skin-ember')
                  ? 'ember'
                  : 'default',
            )
          }
        >
          英雄外形：{player.heroSkin === 'ember' ? '餘燼' : '預設'}
          {!player.achievements.includes('skin-ember') ? '（商店可解鎖餘燼）' : ''}
        </GhostButton>
        <PrimaryButton onClick={actions.save}>立即存檔</PrimaryButton>
      </div>

      <div className="mt-4 rounded-xl border border-raid-mythic/30 bg-black/30 p-3">
        <div className="font-semibold">轉生 Prestige</div>
        <p className="mt-1 text-xs text-raid-muted">
          需要波次 {prestige.need}（目前 {player.currentWave}）。保留成就／設定／寶石進度，重置等級與強化，獲得永久倍率與轉生幣。
        </p>
        <p className="mt-1 text-sm">轉生等級 {player.prestigeLevel} · 轉生幣 {player.prestigeCoins}</p>
        <PrimaryButton className="mt-2" disabled={!prestige.can} onClick={actions.prestige}>
          {prestige.can ? '確認轉生' : `再推到第 ${prestige.need} 波`}
        </PrimaryButton>
      </div>
    </Panel>
  )
}
