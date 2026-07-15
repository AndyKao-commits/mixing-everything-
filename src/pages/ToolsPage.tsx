import { tools } from '../data/tools'
import { ToolList } from '../components/ToolList'

export function ToolsPage() {
  return (
    <section className="section section--page" aria-labelledby="tools-title">
      <div className="section__intro">
        <p className="eyebrow">Tools</p>
        <h1 id="tools-title">工具目錄</h1>
        <p>所有掛進 Mixing 的小東西都會出現在這一份清單。</p>
      </div>
      <ToolList tools={tools} />
    </section>
  )
}
