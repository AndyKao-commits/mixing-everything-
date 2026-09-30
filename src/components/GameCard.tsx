'use client'

export function GameCard({
  icon,
  name,
  description,
  min_players,
  enabled,
  onClick,
}: {
  icon: string
  name: string
  description: string
  min_players: number
  enabled: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={onClick}
      className={`w-full rounded-3xl border border-white/60 bg-white/75 p-5 text-left shadow-pop transition ${
        enabled ? 'hover:-translate-y-0.5 active:scale-[0.99]' : 'opacity-45'
      }`}
    >
      <div className="text-4xl">{icon}</div>
      <h3 className="mt-3 font-display text-2xl font-semibold text-ink">{name}</h3>
      <p className="mt-1 text-sm text-soft">{description}</p>
      <p className="mt-4 text-xs font-medium tracking-wide text-soft">
        {enabled ? `${min_players}人以上` : '即將推出'}
      </p>
    </button>
  )
}
