'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { WindowFrame } from '@/components/WindowFrame'
import {
  createId,
  loadJournalEntries,
  saveJournalEntries,
  type JournalEntry,
} from '@/lib/journal'
import {
  detectPlatform,
  formatRecipeJournalText,
  parseRecipeFromText,
} from '@/lib/recipeParse'

function formatTime(ts: number) {
  return new Intl.DateTimeFormat('zh-Hant', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts))
}

type Mode = 'note' | 'recipe'

function linesToText(lines: string[]) {
  return lines.join('\n')
}

function textToLines(text: string) {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*·]\s*/, '').replace(/^\d+[.．、)]\s*/, '').trim())
    .filter(Boolean)
}

export function JournalBoard() {
  const [mode, setMode] = useState<Mode>('recipe')
  const [text, setText] = useState('')
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [ready, setReady] = useState(false)

  const [sourceUrl, setSourceUrl] = useState('')
  const [caption, setCaption] = useState('')
  const [title, setTitle] = useState('')
  const [ingredientsText, setIngredientsText] = useState('')
  const [stepsText, setStepsText] = useState('')
  const [parseHint, setParseHint] = useState('')

  useEffect(() => {
    setEntries(loadJournalEntries())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveJournalEntries(entries)
  }, [entries, ready])

  const canSaveRecipe = useMemo(() => {
    return Boolean(sourceUrl.trim() && (ingredientsText.trim() || stepsText.trim() || title.trim()))
  }, [sourceUrl, ingredientsText, stepsText, title])

  function submitNote(event?: FormEvent) {
    event?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    const next: JournalEntry = {
      id: createId(),
      kind: 'note',
      text: trimmed,
      createdAt: Date.now(),
    }
    setEntries((prev) => [next, ...prev])
    setText('')
  }

  function organizeRecipe() {
    const url = sourceUrl.trim()
    const body = caption.trim()
    if (!url && !body) {
      setParseHint('先貼上影片連結，或貼上影片說明／字幕文字。')
      return
    }
    if (!body) {
      setParseHint('目前無法直接讀取私密平台影片內容。請複製影片說明／字幕貼上，再按整理。')
      const platform = url ? detectPlatform(url) : '影片'
      setTitle((prev) => prev || `${platform} 食譜`)
      return
    }

    const parsed = parseRecipeFromText(body, url ? `${detectPlatform(url)} 食譜` : '未命名食譜')
    setTitle(parsed.title)
    setIngredientsText(linesToText(parsed.ingredients))
    setStepsText(linesToText(parsed.steps))
    setParseHint(
      parsed.ingredients.length || parsed.steps.length
        ? '已整理材料與步驟，可再微調後寫入日誌。'
        : '沒辨識到清楚段落，請直接在下方手動填材料／步驟。',
    )
  }

  function submitRecipe(event?: FormEvent) {
    event?.preventDefault()
    const url = sourceUrl.trim()
    if (!url) {
      setParseHint('請先貼上影片連結。')
      return
    }

    const ingredients = textToLines(ingredientsText)
    const steps = textToLines(stepsText)
    const recipeTitle = title.trim() || `${detectPlatform(url)} 食譜`

    const next: JournalEntry = {
      id: createId(),
      kind: 'recipe',
      title: recipeTitle,
      sourceUrl: url,
      ingredients,
      steps,
      text: formatRecipeJournalText({
        title: recipeTitle,
        sourceUrl: url,
        ingredients,
        steps,
      }),
      createdAt: Date.now(),
    }

    setEntries((prev) => [next, ...prev])
    setCaption('')
    setIngredientsText('')
    setStepsText('')
    setTitle('')
    setParseHint('已寫入日誌。')
  }

  function remove(id: string) {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }

  return (
    <div className="journal">
      <div className="journal__tabs" role="tablist" aria-label="日誌模式">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'recipe'}
          className={mode === 'recipe' ? 'journal__tab is-active' : 'journal__tab'}
          onClick={() => setMode('recipe')}
        >
          影片轉食譜
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'note'}
          className={mode === 'note' ? 'journal__tab is-active' : 'journal__tab'}
          onClick={() => setMode('note')}
        >
          一般日誌
        </button>
      </div>

      {mode === 'recipe' ? (
        <WindowFrame
          title="食譜整理.exe"
          footer="貼連結 → 整理材料／步驟 → 寫入日誌"
          toolbar={<span className="win__menu">Share · Parse · Save</span>}
        >
          <form className="recipe-form" onSubmit={submitRecipe}>
            <label className="field">
              <span className="field__label">影片連結</span>
              <input
                className="field__input"
                type="url"
                value={sourceUrl}
                placeholder="貼上 Instagram / YouTube / TikTok 連結"
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">影片說明／字幕（可從原貼文複製）</span>
              <textarea
                className="field__textarea"
                rows={5}
                value={caption}
                placeholder={'例如：\n材料\n雞胸肉 200g\n蒜頭 2 瓣\n\n步驟\n1. 肉切塊下鍋\n2. 大火快炒盛起'}
                onChange={(e) => setCaption(e.target.value)}
              />
            </label>

            <div className="journal__actions">
              <p className="journal__hint">{parseHint || '類似 Albo：先整理，再存成日誌食譜'}</p>
              <button type="button" className="btn btn--ghost" onClick={organizeRecipe}>
                整理材料／步驟
              </button>
            </div>

            <label className="field">
              <span className="field__label">食譜標題</span>
              <input
                className="field__input"
                value={title}
                placeholder="例如：蒜香雞胸"
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>

            <div className="recipe-grid">
              <label className="field">
                <span className="field__label">材料</span>
                <textarea
                  className="field__textarea"
                  rows={6}
                  value={ingredientsText}
                  placeholder={'一列一項\n雞胸肉 200g\n鹽 少許'}
                  onChange={(e) => setIngredientsText(e.target.value)}
                />
              </label>
              <label className="field">
                <span className="field__label">步驟</span>
                <textarea
                  className="field__textarea"
                  rows={6}
                  value={stepsText}
                  placeholder={'一列一步\n肉切塊\n大火快炒'}
                  onChange={(e) => setStepsText(e.target.value)}
                />
              </label>
            </div>

            <div className="journal__actions">
              <p className="journal__hint">寫入後會出現在下方日誌列表</p>
              <button type="submit" className="btn btn--primary" disabled={!canSaveRecipe}>
                寫入日誌
              </button>
            </div>
          </form>
        </WindowFrame>
      ) : (
        <WindowFrame title="日誌.txt" footer={`${entries.length} 則 · 寫完立即顯示`} toolbar={<span className="win__menu">File · Edit · View</span>}>
          <form className="journal__composer" onSubmit={submitNote}>
            <textarea
              className="journal__input"
              value={text}
              placeholder="寫下一則日誌……"
              rows={4}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submitNote()
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
      )}

      <section className="journal__feed" aria-live="polite" aria-label="日誌列表">
        {!ready ? (
          <p className="journal__empty">讀取中…</p>
        ) : entries.length === 0 ? (
          <p className="journal__empty">還沒有日誌。貼影片連結整理食譜，或寫一則一般日誌。</p>
        ) : (
          <ul className="journal__list">
            {entries.map((entry) => (
              <li key={entry.id} className={entry.kind === 'recipe' ? 'journal__item journal__item--recipe' : 'journal__item'}>
                <div className="journal__meta">
                  <div className="journal__meta-left">
                    <time dateTime={new Date(entry.createdAt).toISOString()}>{formatTime(entry.createdAt)}</time>
                    <span className="journal__badge">{entry.kind === 'recipe' ? '食譜' : '日誌'}</span>
                  </div>
                  <button type="button" className="journal__delete" onClick={() => remove(entry.id)}>
                    刪除
                  </button>
                </div>

                {entry.kind === 'recipe' ? (
                  <article className="recipe-card">
                    <h3 className="recipe-card__title">{entry.title || '未命名食譜'}</h3>
                    {entry.sourceUrl ? (
                      <a className="recipe-card__source" href={entry.sourceUrl} target="_blank" rel="noreferrer">
                        開啟原影片（{detectPlatform(entry.sourceUrl)}）
                      </a>
                    ) : null}
                    {entry.ingredients?.length ? (
                      <div className="recipe-card__block">
                        <h4>材料</h4>
                        <ul>
                          {entry.ingredients.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {entry.steps?.length ? (
                      <div className="recipe-card__block">
                        <h4>步驟</h4>
                        <ol>
                          {entry.steps.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </article>
                ) : (
                  <p className="journal__text">{entry.text}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
