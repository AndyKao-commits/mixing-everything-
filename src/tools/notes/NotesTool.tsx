'use client'

import { useEffect, useState } from 'react'
import { WindowFrame } from '@/components/WindowFrame'

const KEY = 'mixing-notes-v1'

export function NotesTool() {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setText(window.localStorage.getItem(KEY) ?? '')
  }, [])

  return (
    <div className="tool-page">
      <WindowFrame
        title="隨手記.txt"
        footer={saved ? '已儲存到本機' : '尚未儲存'}
        toolbar={<span className="win__menu">File · Edit · View</span>}
      >
        <div className="notes-tool">
          <textarea
            className="notes-tool__area"
            value={text}
            placeholder="寫點什麼……"
            onChange={(e) => {
              setText(e.target.value)
              setSaved(false)
            }}
          />
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              window.localStorage.setItem(KEY, text)
              setSaved(true)
            }}
          >
            {saved ? '已儲存' : '儲存到本機'}
          </button>
        </div>
      </WindowFrame>
    </div>
  )
}
