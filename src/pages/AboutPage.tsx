import { Link } from 'react-router-dom'

export function AboutPage() {
  return (
    <section className="section section--page about-page" aria-labelledby="about-title">
      <div className="section__intro">
        <p className="eyebrow">About</p>
        <h1 id="about-title">這是一台慢慢長大的雜物站</h1>
        <p>
          Mixing Everything 的目標很單純：之後做的計時器、轉換器、筆記、小遊戲、實驗頁，
          全部都集中在同一個站點裡維護與分享。
        </p>
      </div>

      <ol className="steps">
        <li>
          <strong>在 `src/tools/` 新增資料夾</strong>
          <span>每個小功能自成一個元件。</span>
        </li>
        <li>
          <strong>到 `src/data/tools.ts` 註冊</strong>
          <span>填上 id、名稱、說明，並掛上 Component。</span>
        </li>
        <li>
          <strong>自動出現在首頁與目錄</strong>
          <span>路由 `/tools/:toolId` 會立刻可用。</span>
        </li>
      </ol>

      <Link className="btn btn--primary" to="/tools">
        先看現有工具
      </Link>
    </section>
  )
}
