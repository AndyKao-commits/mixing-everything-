import { useState } from 'react'

export function CounterTool() {
  const [count, setCount] = useState(0)

  return (
    <div className="demo-tool">
      <p className="demo-tool__label">目前數值</p>
      <p className="demo-tool__value" aria-live="polite">
        {count}
      </p>
      <div className="demo-tool__actions">
        <button type="button" className="btn btn--ghost" onClick={() => setCount((n) => n - 1)}>
          −1
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => setCount(0)}>
          歸零
        </button>
        <button type="button" className="btn btn--primary" onClick={() => setCount((n) => n + 1)}>
          +1
        </button>
      </div>
    </div>
  )
}
