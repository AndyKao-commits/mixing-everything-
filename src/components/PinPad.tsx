'use client'

export function PinPad({
  value,
  onChange,
  max = 4,
}: {
  value: string
  onChange: (v: string) => void
  max?: number
}) {
  function press(n: string) {
    if (value.length >= max) return
    onChange(value + n)
  }
  function back() {
    onChange(value.slice(0, -1))
  }

  return (
    <div className="space-y-5">
      <div className="pin-dots">
        {Array.from({ length: max }).map((_, i) => (
          <span key={i} className={`pin-dot ${i < value.length ? 'on' : ''}`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => {
          if (!key) return <div key="empty" />
          return (
            <button
              key={key}
              type="button"
              className="min-h-14 rounded-2xl bg-white text-xl font-semibold shadow-card active:scale-95"
              onClick={() => (key === '⌫' ? back() : press(key))}
            >
              {key}
            </button>
          )
        })}
      </div>
    </div>
  )
}
