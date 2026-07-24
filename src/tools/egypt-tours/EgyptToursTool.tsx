'use client'

import { useEffect, useMemo, useState } from 'react'
import { WindowFrame } from '@/components/WindowFrame'
import {
  egyptTours,
  formatPrice,
  sortTours,
  type EgyptTour,
  type SortKey,
} from '@/data/egyptTours'

type CompareView = 'table' | 'cards'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'price', label: '價格' },
  { key: 'days', label: '天數' },
  { key: 'goDate', label: '出發日' },
  { key: 'transferCount', label: '轉機次數' },
]

function transferLabel(tour: EgyptTour) {
  return `${tour.transferCount} 次 · ${tour.transferHub}`
}

export function EgyptToursTool() {
  const [selectedId, setSelectedId] = useState(egyptTours[0]?.id ?? '')
  const [sortKey, setSortKey] = useState<SortKey>('price')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [brand, setBrand] = useState<'全部' | '旅天下' | '雄獅'>('全部')
  const [compareView, setCompareView] = useState<CompareView>('table')
  const [picked, setPicked] = useState<string[]>(() => egyptTours.map((t) => t.id))

  const selected = egyptTours.find((t) => t.id === selectedId) ?? egyptTours[0]

  const filtered = useMemo(() => {
    const base = egyptTours.filter((t) => (brand === '全部' ? true : t.brand === brand))
    const visible = base.filter((t) => picked.includes(t.id))
    return sortTours(visible.length ? visible : base, sortKey, sortDir)
  }, [brand, picked, sortKey, sortDir])

  useEffect(() => {
    if (!selected) return
    const el = document.getElementById('egypt-tour-detail')
    if (el && window.matchMedia('(max-width: 839px)').matches) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedId, selected])

  function togglePick(id: string) {
    setPicked((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev
        return prev.filter((x) => x !== id)
      }
      return [...prev, id]
    })
  }

  function selectTour(id: string) {
    setSelectedId(id)
  }

  if (!selected) return null

  return (
    <div className="tool-page egypt-tool">
      <header className="page__header egypt-tool__intro">
        <p className="egypt-tool__kicker">Egypt · Nov 2026</p>
        <h1>埃及團介紹</h1>
        <p className="muted">上方點選團名，下方顯示該團重點與完整行程順序。</p>
      </header>

      <WindowFrame title="tour-list.txt" footer={`${egyptTours.length} 團 · 點選查看內容`}>
        <nav className="egypt-tour-list" aria-label="行程列表">
          {egyptTours.map((tour, index) => {
            const active = tour.id === selected.id
            return (
              <button
                key={tour.id}
                type="button"
                className={active ? 'egypt-tour-list__item is-active' : 'egypt-tour-list__item'}
                onClick={() => selectTour(tour.id)}
                aria-current={active ? 'true' : undefined}
              >
                <span className="egypt-tour-list__index">{String(index + 1).padStart(2, '0')}</span>
                <span className="egypt-tour-list__copy">
                  <strong>{tour.shortName}</strong>
                  <span>
                    {tour.days} 日 · {formatPrice(tour.price)} · {tour.airline}
                  </span>
                </span>
              </button>
            )
          })}
        </nav>
      </WindowFrame>

      <div id="egypt-tour-detail">
        <WindowFrame
          title={`${selected.shortName}.md`}
          footer={
            <a className="egypt-link" href={selected.shortUrl} target="_blank" rel="noreferrer">
              原文 {selected.shortUrl}
            </a>
          }
        >
          <article className="egypt-detail">
            <div className="egypt-detail__hero">
              <img src={selected.image} alt="" />
              <div>
                <p className="egypt-tool__kicker">
                  {selected.brand} · {selected.series}
                </p>
                <h2>{selected.name}</h2>
                <p className="egypt-detail__price">{formatPrice(selected.price)}</p>
                {selected.priceNote ? <p className="muted">{selected.priceNote}</p> : null}
                <div className="egypt-detail__tags">
                  {selected.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            <section className="egypt-summary">
              <h3>行程摘要</h3>
              <dl className="egypt-dl">
                <div>
                  <dt>天數</dt>
                  <dd>{selected.days} 日</dd>
                </div>
                <div>
                  <dt>出發／回程</dt>
                  <dd>
                    {selected.goDate} → {selected.backDate}
                  </dd>
                </div>
                <div>
                  <dt>出發地</dt>
                  <dd>{selected.departCity}</dd>
                </div>
                <div>
                  <dt>去程起飛</dt>
                  <dd>{selected.goDeparture}</dd>
                </div>
                <div>
                  <dt>航空</dt>
                  <dd>
                    {selected.airline}
                    {selected.backAirline !== selected.airline
                      ? `／回程 ${selected.backAirline}`
                      : ''}
                  </dd>
                </div>
                <div>
                  <dt>轉機</dt>
                  <dd>{transferLabel(selected)}</dd>
                </div>
                <div>
                  <dt>去程路線</dt>
                  <dd>{selected.goRoute}</dd>
                </div>
                <div>
                  <dt>回程路線</dt>
                  <dd>{selected.backRoute}</dd>
                </div>
                <div>
                  <dt>機位</dt>
                  <dd>
                    可售 {selected.seatsLeft}／總 {selected.totalSeats}
                  </dd>
                </div>
              </dl>
            </section>

            <section>
              <h3>行程重點</h3>
              <ul className="egypt-bullets">
                {selected.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <h3>與其他團的差異</h3>
              <ul className="egypt-bullets">
                {selected.differences.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              <h3>住宿／移動</h3>
              <ul className="egypt-bullets">
                {selected.lodging.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
            </section>

            <section className="egypt-itin">
              <h3>整趟行程順序</h3>
              <ol className="egypt-itin__list">
                {selected.itinerary.map((day) => (
                  <li key={day.day} className="egypt-itin__item">
                    <div className="egypt-itin__day">第 {day.day} 天</div>
                    <div className="egypt-itin__body">
                      <p className="egypt-itin__title">{day.title}</p>
                      {day.note ? <p className="egypt-itin__note">{day.note}</p> : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </article>
        </WindowFrame>
      </div>

      <header className="page__header egypt-tool__intro egypt-tool__compare-intro">
        <p className="egypt-tool__kicker">Compare</p>
        <h2>各團比較與重點整理</h2>
        <p className="muted">可篩選、排序、對照價格／轉機／差異；點列會同步上方單一團介紹。</p>
      </header>

      <WindowFrame
        title="egypt-compare.tsv"
        toolbar={
          <div className="egypt-tool__toolbar">
            <div className="egypt-tool__seg" role="group" aria-label="比較檢視">
              <button
                type="button"
                className={compareView === 'table' ? 'is-on' : undefined}
                onClick={() => setCompareView('table')}
              >
                比較表
              </button>
              <button
                type="button"
                className={compareView === 'cards' ? 'is-on' : undefined}
                onClick={() => setCompareView('cards')}
              >
                重點卡片
              </button>
            </div>
            <label className="egypt-tool__field">
              <span>品牌</span>
              <select value={brand} onChange={(e) => setBrand(e.target.value as typeof brand)}>
                <option value="全部">全部</option>
                <option value="旅天下">旅天下</option>
                <option value="雄獅">雄獅</option>
              </select>
            </label>
            <label className="egypt-tool__field">
              <span>排序</span>
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="btn"
              onClick={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))}
            >
              {sortDir === 'asc' ? '升冪 ↑' : '降冪 ↓'}
            </button>
          </div>
        }
        footer={`${filtered.length} 團顯示 · 點列可切換上方介紹`}
      >
        <div className="egypt-tool__picks" aria-label="選擇要比較的行程">
          {egyptTours.map((t) => {
            const on = picked.includes(t.id)
            return (
              <button
                key={t.id}
                type="button"
                className={on ? 'egypt-chip is-on' : 'egypt-chip'}
                onClick={() => togglePick(t.id)}
                aria-pressed={on}
              >
                <span className="egypt-chip__price">{formatPrice(t.price)}</span>
                <span>{t.shortName}</span>
              </button>
            )
          })}
        </div>

        {compareView === 'table' ? (
          <div className="egypt-table-wrap">
            <table className="egypt-table">
              <thead>
                <tr>
                  <th>行程</th>
                  <th>價格</th>
                  <th>天數</th>
                  <th>出發／回程</th>
                  <th>航空</th>
                  <th>轉機</th>
                  <th>重點差異</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((tour) => (
                  <tr
                    key={tour.id}
                    className={selected.id === tour.id ? 'is-selected' : undefined}
                    onClick={() => selectTour(tour.id)}
                  >
                    <td>
                      <div className="egypt-table__name">
                        <strong>{tour.shortName}</strong>
                        <span>
                          {tour.brand} · {tour.groupId}
                        </span>
                      </div>
                    </td>
                    <td className="egypt-table__price">
                      <strong>{formatPrice(tour.price)}</strong>
                      {tour.priceNote ? <span>{tour.priceNote}</span> : null}
                    </td>
                    <td>{tour.days} 日</td>
                    <td>
                      {tour.goDate}
                      <br />
                      <span className="muted">{tour.backDate}</span>
                    </td>
                    <td>
                      {tour.airline}
                      {tour.backAirline !== tour.airline ? (
                        <>
                          <br />
                          <span className="muted">回 {tour.backAirline}</span>
                        </>
                      ) : null}
                    </td>
                    <td>{transferLabel(tour)}</td>
                    <td>
                      <ul className="egypt-mini-list">
                        {tour.differences.slice(0, 2).map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <a
                        className="egypt-link"
                        href={tour.shortUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        原文
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="egypt-cards">
            {filtered.map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                active={selected.id === tour.id}
                onSelect={() => selectTour(tour.id)}
              />
            ))}
          </div>
        )}
      </WindowFrame>

      <WindowFrame title="quick-diff.txt" footer="方便一眼判斷怎麼選">
        <div className="egypt-quick">
          <section>
            <h3>怎麼快速分流</h3>
            <ul className="egypt-bullets">
              <li>
                <strong>預算優先</strong>：鬧著玩 MU 10 日（59,900）→ 阿提哈德 11 日（79,900）
              </li>
              <li>
                <strong>少轉機／海灣航線</strong>：阿聯酋杜拜、阿提哈德阿布達比、土耳其伊斯坦堡（皆 1
                次）
              </li>
              <li>
                <strong>天數最長划算</strong>：旅展特選 13 日 TK（94,900）
              </li>
              <li>
                <strong>體驗加碼</strong>：玩樂 369（聲光秀＋一段飛）或尋寶經典（古夫餐廳／連鎖五星）
              </li>
              <li>
                <strong>奢華定位</strong>：璽品奢御尼羅 13 日（225,900）
              </li>
            </ul>
          </section>
          <section>
            <h3>轉機樞紐對照</h3>
            <ul className="egypt-bullets">
              <li>上海浦東 ×2：旅天下兩條 MU（11/01）</li>
              <li>北京首都 ×2：國航假期（11/07）</li>
              <li>杜拜 ×1：早鳥特選／尋寶／玩樂 369／璽品</li>
              <li>伊斯坦堡 ×1：旅展特選 13 日</li>
              <li>阿布達比 ×1：阿提哈德特選 11 日</li>
            </ul>
          </section>
        </div>
      </WindowFrame>
    </div>
  )
}

function TourCard({
  tour,
  active,
  onSelect,
}: {
  tour: EgyptTour
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      className={active ? 'egypt-card is-active' : 'egypt-card'}
      onClick={onSelect}
    >
      <img src={tour.image} alt="" />
      <div className="egypt-card__body">
        <div className="egypt-card__top">
          <strong>{tour.shortName}</strong>
          <span>{formatPrice(tour.price)}</span>
        </div>
        <p>
          {tour.days} 日 · {tour.goDate} 出發 · {tour.airline}
        </p>
        <p className="muted">{transferLabel(tour)}</p>
        <ul className="egypt-mini-list">
          {tour.highlights.slice(0, 3).map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
    </button>
  )
}
