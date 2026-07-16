'use client'

import { useState } from 'react'
import { WindowFrame } from '@/components/WindowFrame'

export function CounterTool() {
  const [n, setN] = useState(0)

  return (
    <div className="tool-page">
      <WindowFrame title="計數器.exe" footer={`count = ${n}`}>
        <div className="counter-tool">
          <p className="counter-tool__label">現在數到</p>
          <p className="counter-tool__value">{n}</p>
          <div className="counter-tool__actions">
            <button type="button" className="btn btn--primary" onClick={() => setN((v) => v + 1)}>
              +1
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => setN(0)}>
              歸零
            </button>
          </div>
        </div>
      </WindowFrame>
    </div>
  )
}
