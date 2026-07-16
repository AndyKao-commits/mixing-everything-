import { WindowFrame } from '@/components/WindowFrame'

export default function AboutPage() {
  return (
    <div className="page">
      <header className="page__header">
        <h1>關於</h1>
        <p>Mixing Everything 多功能小工具站基礎模板。主頁可把做菜影片整理成食譜日誌。</p>
      </header>

      <WindowFrame title="如何新增工具" footer="src/data/tools.ts">
        <ol className="steps">
          <li>
            在 <code>src/tools/&lt;tool-id&gt;/</code> 建立元件
          </li>
          <li>
            到 <code>src/data/tools.ts</code> 註冊（id、名稱、說明、Component）
          </li>
          <li>左側列表會自動出現，點開即可使用</li>
        </ol>
      </WindowFrame>

      <WindowFrame title="影片轉食譜" footer="貼連結 + 說明文字 → 材料／步驟 → 日誌">
        <ol className="steps">
          <li>在主頁切到「影片轉食譜」</li>
          <li>貼上影片連結，並貼上貼文說明／字幕</li>
          <li>按整理後寫入日誌，之後可從列表回看</li>
        </ol>
      </WindowFrame>
    </div>
  )
}
