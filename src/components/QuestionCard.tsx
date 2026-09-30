'use client'

export function QuestionCard({
  baseScore,
  text,
  mode,
}: {
  baseScore: number
  text: string
  mode: string
}) {
  const lead =
    mode === 'reverse'
      ? `他是 ${baseScore} 分男，`
      : `他是 ${baseScore} 分男，`

  return (
    <div className="animate-flip-in rounded-[2rem] bg-white/85 p-6 shadow-pop">
      <p className="text-sm font-medium tracking-wide text-coral">💘 滿分男</p>
      <p className="mt-4 font-display text-3xl font-bold leading-snug text-ink sm:text-4xl">
        {lead}
      </p>
      <p className="mt-3 font-display text-3xl font-bold leading-snug text-ink sm:text-4xl">
        {text}
      </p>
    </div>
  )
}
