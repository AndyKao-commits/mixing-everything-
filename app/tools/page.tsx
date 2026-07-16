import { ToolList } from '@/components/ToolList'
import { tools } from '@/data/tools'

export default function ToolsPage() {
  return (
    <div className="page">
      <header className="page__header">
        <h1>工具總覽</h1>
        <p>從左側列表點開任一工具即可使用。</p>
      </header>
      <ToolList tools={tools} />
    </div>
  )
}
