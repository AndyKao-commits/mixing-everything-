'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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

type ExtractResult = {
  title: string
  ingredients: string[]
  steps: string[]
  notes: string[]
  sourceUrl?: string
  platform: string
  sourceText: string
  warnings: string[]
  used: string[]
}

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
  const [scanning, setScanning] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [openaiReady, setOpenaiReady] = useState(false)
  const [publicFetchReady, setPublicFetchReady] = useState(true)

  useEffect(() => {
    setEntries(loadJournalEntries())
    setReady(true)
    fetch('/api/recipe/status', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        setOpenaiReady(Boolean(data?.capabilities?.openai))
        setPublicFetchReady(Boolean(data?.capabilities?.publicVideoFetch ?? true))
      })
      .catch(() => {
        // API may be unavailable in pure static previews
      })
  }, [])

  useEffect(() => {
    if (!ready) return
    saveJournalEntries(entries)
  }, [entries, ready])

  const canSaveRecipe = useMemo(() => {
    return Boolean(
      (sourceUrl.trim() || uploadFile) && (ingredientsText.trim() || stepsText.trim() || title.trim()),
    )
  }, [sourceUrl, uploadFile, ingredientsText, stepsText, title])

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

  async function scanRecipe() {
    const url = sourceUrl.trim()
    if (!url && !caption.trim() && !uploadFile) {
      setParseHint('請貼上影片連結、說明文字，或上傳影片檔。')
      return
    }

    setScanning(true)
    setParseHint('正在掃描影片內容…')
    try {
      const form = new FormData()
      if (url) form.set('url', url)
      if (caption.trim()) form.set('caption', caption.trim())
      if (uploadFile) form.set('file', uploadFile)

      const res = await fetch('/api/recipe/extract', {
        method: 'POST',
        body: form,
      })
      const data = (await res.json()) as { ok?: boolean; result?: ExtractResult; error?: string }
      if (!res.ok || !data.result) {
        throw new Error(data.error || '掃描失敗')
      }

      const result = data.result
      setTitle(result.title || '')
      setIngredientsText(linesToText(result.ingredients))
      setStepsText(linesToText(result.steps))
      if (!caption.trim() && result.sourceText) {
        setCaption(result.sourceText.slice(0, 4000))
      }

      const used = result.used.length ? `使用：${result.used.join(', ')}` : ''
      const warns = result.warnings.slice(0, 3).join('；')
      setParseHint([used, warns].filter(Boolean).join('。 ') || '掃描完成，可微調後寫入日誌。')
    } catch (error) {
      setParseHint(error instanceof Error ? error.message : '掃描失敗')
    } finally {
      setScanning(false)
    }
  }

  function submitRecipe(event?: FormEvent) {
    event?.preventDefault()
    const url = sourceUrl.trim() || (uploadFile ? `upload://${uploadFile.name}` : '')
    if (!url) {
      setParseHint('請先貼上影片連結或上傳影片。')
      return
    }

    const ingredients = textToLines(ingredientsText)
    const steps = textToLines(stepsText)
    const recipeTitle = title.trim() || `${detectPlatform(url)} 食譜`

    const next: JournalEntry = {
      id: createId(),
      kind: 'recipe',
      title: recipeTitle,
      sourceUrl: url.startsWith('upload://') ? undefined : url,
      ingredients,
      steps,
      text: formatRecipeJournalText({
        title: recipeTitle,
        sourceUrl: url.startsWith('upload://') ? '本機上傳影片' : url,
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
    setUploadFile(null)
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
          title="影片掃描.exe"
          footer="掃描影片 → 材料／步驟 → 寫入日誌"
          toolbar={<span className="win__menu">Scan · Parse · Save</span>}
        >
          <form className="recipe-form" onSubmit={submitRecipe}>
            <div className="scan-status">
              <span className={publicFetchReady ? 'pill pill--ok' : 'pill'}>
                公開影片：{publicFetchReady ? '可收入他人內容' : '不可用'}
              </span>
              <span className={openaiReady ? 'pill pill--ok' : 'pill'}>
                語音掃描：{openaiReady ? '已啟用' : '未設定'}
              </span>
              <Link href="/settings" className="scan-status__link">
                設定 API →
              </Link>
            </div>

            <label className="field">
              <span className="field__label">別人的食譜影片連結</span>
              <input
                className="field__input"
                type="url"
                value={sourceUrl}
                placeholder="貼上 Instagram / YouTube / TikTok 公開影片連結"
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </label>

            <label className="field">
              <span className="field__label">上傳影片／音訊（可選，Whisper 掃描內容）</span>
              <input
                className="field__input"
                type="file"
                accept="video/*,audio/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
              {uploadFile ? <span className="field__help">已選：{uploadFile.name}</span> : null}
            </label>

            <label className="field">
              <span className="field__label">補充說明／字幕（可選）</span>
              <textarea
                className="field__textarea"
                rows={4}
                value={caption}
                placeholder="若平台擋抓取，可貼上說明或字幕輔助整理"
                onChange={(e) => setCaption(e.target.value)}
              />
            </label>

            <div className="journal__actions">
              <p className="journal__hint">
                {parseHint ||
                  '直接貼別人的公開食譜影片。系統會抓說明與音訊，整理材料／步驟，不用自己一項項核對。'}
              </p>
              <button type="button" className="btn btn--primary" onClick={scanRecipe} disabled={scanning}>
                {scanning ? '收入中…' : '收入並整理食譜'}
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
              <p className="journal__hint">確認無誤後寫入日誌</p>
              <button type="submit" className="btn btn--ghost" disabled={!canSaveRecipe}>
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
          <p className="journal__empty">還沒有日誌。掃描影片整理食譜，或寫一則一般日誌。</p>
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
