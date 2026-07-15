import { Link } from 'react-router-dom'
import { ToolList } from '../components/ToolList'
import { tools } from '../data/tools'

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero__copy">
          <p className="hero__brand">Mixing Everything</p>
          <h1 className="hero__headline">之後做的小東西，都放這裡。</h1>
          <p className="hero__lead">
            這是一個可持續擴充的工坊。新工具直接掛進註冊表，就會出現在目錄裡。
          </p>
          <div className="hero__actions">
            <Link className="btn btn--primary" to="/tools">
              查看工具
            </Link>
            <Link className="btn btn--ghost" to="/about">
              怎麼擴充
            </Link>
          </div>
        </div>
        <div className="hero__visual" aria-hidden="true">
          <div className="hero__orb hero__orb--a" />
          <div className="hero__orb hero__orb--b" />
          <svg className="hero__mark" viewBox="0 0 240 240" fill="none">
            <path
              d="M48 168c24-56 40-88 56-88s32 32 56 88"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <circle cx="104" cy="80" r="12" fill="#F26B3A" />
            <path
              d="M36 196h168"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.35"
            />
          </svg>
        </div>
      </section>

      <section className="section" aria-labelledby="home-tools-title">
        <div className="section__intro">
          <h2 id="home-tools-title">目前能用的</h2>
          <p>示範工具與小遊戲都會列在這裡，之後持續加。</p>
        </div>
        <ToolList tools={tools} />
      </section>
    </>
  )
}
