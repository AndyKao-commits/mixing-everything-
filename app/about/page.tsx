import { WindowFrame } from '@/components/WindowFrame'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="page">
      <header className="page__header">
        <h1>關於</h1>
        <p>Mixing Everything：貼上別人的食譜影片，自動整理材料／步驟並寫入日誌。</p>
      </header>

      <WindowFrame title="收入別人的食譜" footer="/api/recipe/extract">
        <ol className="steps">
          <li>貼上對方公開的 IG／YouTube／TikTok 連結</li>
          <li>按「收入並整理食譜」</li>
          <li>確認材料／步驟後寫入日誌</li>
        </ol>
        <p style={{ marginTop: '0.75rem' }}>
          不需登入 Instagram，也不限自己的影片。
        </p>
      </WindowFrame>

      <WindowFrame title="建議設定" footer="/settings">
        <ol className="steps">
          <li>
            設定 <code>OPENAI_API_KEY</code>，才能掃旁白內容
          </li>
          <li>沒有 key 時，仍會先用公開貼文說明整理</li>
        </ol>
        <p style={{ marginTop: '0.75rem' }}>
          <Link href="/settings">前往設定 →</Link>
        </p>
      </WindowFrame>

      <WindowFrame title="如何新增工具" footer="src/data/tools.ts">
        <ol className="steps">
          <li>
            在 <code>src/tools/&lt;tool-id&gt;/</code> 建立元件
          </li>
          <li>
            到 <code>src/data/tools.ts</code> 註冊
          </li>
          <li>左側列表會自動出現</li>
        </ol>
      </WindowFrame>
    </div>
  )
}
