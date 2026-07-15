import { useEffect, useState } from 'react'

const STORAGE_KEY = 'mixing-notes'

export function NotesTool() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, text)
    } catch {
      // ignore quota / private mode errors
    }
  }, [text])

  return (
    <div className="demo-tool demo-tool--notes">
      <label className="demo-tool__label" htmlFor="scratchpad">
        寫下任何東西
      </label>
      <textarea
        id="scratchpad"
        className="notes-input"
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="這段文字會保存在這個瀏覽器裡……"
        rows={10}
      />
      <div className="demo-tool__actions">
        <button type="button" className="btn btn--ghost" onClick={() => setText('')}>
          清空
        </button>
        <span className="notes-hint">{text.length} 字</span>
      </div>
    </div>
  )
}
