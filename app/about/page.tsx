import { WindowFrame } from '@/components/WindowFrame'

export default function AboutPage() {
  return (
    <div className="page">
      <header className="page__header">
        <h1>關於</h1>
        <p>Mixing Everything 多功能小工具站基礎模板。</p>
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
    </div>
  )
}
