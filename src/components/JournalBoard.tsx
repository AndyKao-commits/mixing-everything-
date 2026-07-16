'use client'

import { FormEvent, useEffect, useState } from 'react'
import { WindowFrame } from '@/components/WindowFrame'
import {
  createId,
  loadJournalEntries,
  saveJournalEntries,
  type JournalEntry,
} from '@/lib/journal'

function formatTime(ts: number) {
  return new Intl.DateTimeFormat('zh-Hant', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

export function JournalBoard() {
  const [text, setText] = useState('')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setEntries(loadJournalEntries())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveJournalEntries(entries)
  }, [entries, ready])

  function submit(event?: FormEvent) {
    event?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    const next: JournalEntry = {
      id: createId(),
      text: trimmed,
      createdAt: Date.now(),
    }
    setEntries((prev) => [next, ...prev])
    setText('')
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  return (
    <div className="journal">
      <WindowFrame title="日誌.txt" footer={`${entries.length} 則 · 寫完立即顯示`} toolbar={<span className="win__menu">File · Edit · View</span>}>
        <form className="journal__composer" onSubmit={submit}>
          <textarea
            className="journal__input"
            value={text}
            placeholder="寫下一則日誌……"
            rows={4}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit()
            }}
          />
          <div className="journal__actions">
            <p className="journal__hint">Ctrl / ⌘ + Enter 送出</p>
            <button type="submit" className="btn btn--primary" disabled={!text.trim()}>
              寫入日誌
            </button>
          </div>
        </form>
      </WindowFrame>

      <section className="journal__feed" aria-live="polite" aria-label="日誌列表">
        {!ready ? (
          <p className="journal__empty">讀取中…</p>
        ) : entries.length === 0 ? (
          <p className="journal__empty">還沒有日誌。寫一則，會立刻出現在這裡。</p>
        ) : (
          <ul className="journal__list">
            {entries.map((entry) => (
              <li key={entry.id} className="journal__item">
                <div className="journal__meta">
                  <time dateTime={new Date(entry.createdAt).toISOString()}>{formatTime(entry.createdAt)}</time>
                  <button type="button" className="journal__delete" onClick={() => remove(entry.id)}>
                    刪除
                  </button>
                </div>
                <p className="journal__text">{entry.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
