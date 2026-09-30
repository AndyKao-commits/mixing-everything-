'use client'

import { SCORE_DEFAULT, SCORE_MAX, SCORE_MIN } from '@/lib/constants'

export function ScoreSlider({
  value,
  onChange,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  disabled?: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm text-soft">你給他幾分？</p>
        <p className="mt-2 font-display text-7xl font-bold text-coral tabular-nums">{value}</p>
      </div>
      <input
        type="range"
        min={SCORE_MIN}
        max={SCORE_MAX}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="score-slider w-full"
        aria-label="評分"
      />
      <div className="flex justify-between text-xs font-medium text-soft">
        <span>{SCORE_MIN}</span>
        <span>預設 {SCORE_DEFAULT}</span>
        <span>{SCORE_MAX}</span>
      </div>
    </div>
  )
}
