import { WindowFrame } from '@/components/WindowFrame'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="page">
      <header className="page__header">
        <h1>關於</h1>
        <p>Mixing Everything：可掃描做菜影片、整理食譜，並寫入日誌的多功能模板。</p>
      </header>

      <WindowFrame title="影片掃描" footer="/api/recipe/extract">
        <ol className="steps">
          <li>貼上影片連結，或直接上傳影片檔</li>
          <li>按「掃描影片並整理」取得材料／步驟</li>
          <li>確認後寫入日誌</li>
        </ol>
      </WindowFrame>

      <WindowFrame title="Instagram 為何要登入" footer="/settings">
        <ol className="steps">
          <li>IG 會擋未登入的內容抓取</li>
          <li>官方 Graph API 只能讀你登入帳號自己的媒體</li>
          <li>他人 Reel：請上傳影片、貼說明，或設定第三方 Media API</li>
        </ol>
        <p style={{ marginTop: '0.75rem' }}>
          <Link href="/settings">前往設定／登入 →</Link>
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
