import Link from 'next/link'
import { ToolList } from '@/components/ToolList'
import { Landscape } from '@/components/Landscape'
import { WindowFrame } from '@/components/WindowFrame'
import { tools } from '@/data/tools'
import { IconFolder, IconHome, IconNotes, IconSearch } from '@/components/icons'

const features = [
  {
    title: '掛載即用',
    desc: '新工具註冊後自動出現在目錄與路由。',
    Icon: IconFolder,
  },
  {
    title: '本機優先',
    desc: '示範工具用 LocalStorage，不依賴後端。',
    Icon: IconNotes,
  },
  {
    title: '可換皮',
    desc: '統一的視窗與按鈕樣式，之後換主題也方便。',
    Icon: IconSearch,
  },
]

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <p className="hero__brand">Mixing Everything</p>
        <h1 className="hero__headline">小工具慢慢累積的工坊。</h1>
        <p className="hero__lead">
          多功能網站基礎模板：首頁、工具目錄、關於頁與可擴充註冊表，之後做的東西都放這裡。
        </p>

        <ul className="feature-row">
          {features.map(({ title, desc, Icon }) => (
            <li key={title} className="feature-row__item">
              <span className="feature-row__icon">
                <Icon className="feature-row__svg" />
              </span>
              <strong>{title}</strong>
              <p>{desc}</p>
            </li>
          ))}
        </ul>

        <div className="hero__actions">
          <Link href="/tools/" className="btn btn--primary">
            開始探索
          </Link>
          <Link href="/about/" className="btn btn--ghost">
            怎麼擴充
          </Link>
        </div>
      </section>

      <section className="desktop-preview" aria-label="桌面預覽">
        <WindowFrame
          title="Now playing"
          toolbar={
            <label className="search-bar">
              <IconSearch className="search-bar__icon" />
              <span>搜尋工具…</span>
            </label>
          }
          footer={
            <span className="desktop-preview__status">
              <IconHome className="desktop-preview__status-icon" /> Ready
            </span>
          }
        >
          <div className="player-panel">
            <p className="player-panel__label">目前可用</p>
            <p className="player-panel__title">{tools.length} 個示範工具</p>
            <div className="player-panel__controls" aria-hidden="true">
              <span /><span className="is-play" /><span /><span />
            </div>
          </div>
        </WindowFrame>

        <aside className="desktop-icons" aria-hidden="true">
          <div className="desktop-icon"><IconFolder className="desktop-icon__svg" /><span>Tools</span></div>
          <div className="desktop-icon"><IconNotes className="desktop-icon__svg" /><span>Notes</span></div>
          <div className="desktop-icon"><IconHome className="desktop-icon__svg" /><span>Home</span></div>
        </aside>
      </section>

      <section className="section" aria-labelledby="home-tools-title">
        <div className="section__intro">
          <h2 id="home-tools-title">目前能用的</h2>
          <p>從兩個示範開始，之後每個小功能都會列在這裡。</p>
        </div>
        <ToolList tools={tools} />
      </section>

      <Landscape />
    </>
  )
}
