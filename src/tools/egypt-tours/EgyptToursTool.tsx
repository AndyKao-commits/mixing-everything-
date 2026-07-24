'use client'

import { useEffect, useState } from 'react'
import { WindowFrame } from '@/components/WindowFrame'
import { egyptTours, formatPrice, type EgyptTour } from '@/data/egyptTours'

function transferLabel(tour: EgyptTour) {
  return `${tour.transferCount} 次 · ${tour.transferHub}`
}

export function EgyptToursTool() {
  const [selectedId, setSelectedId] = useState(egyptTours[0]?.id ?? '')

  const selected = egyptTours.find((t) => t.id === selectedId) ?? egyptTours[0]

  useEffect(() => {
    if (!selected) return
    const el = document.getElementById('egypt-tour-detail')
    if (el && window.matchMedia('(max-width: 839px)').matches) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedId, selected])

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
                onClick={() => setSelectedId(tour.id)}
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
    </div>
  )
}
