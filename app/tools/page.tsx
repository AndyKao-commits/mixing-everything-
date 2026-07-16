import Link from 'next/link'
import { ToolList } from '@/components/ToolList'
import { tools } from '@/data/tools'

export default function ToolsPage() {
  return (
    <div className="page">
      <Link href="/" className="back-link">
        ← 回首頁
      </Link>
      <header className="page__header">
        <h1>工具列表</h1>
        <p>已註冊的小工具都會出現在這裡。新增方式見關於頁。</p>
      </header>
      <ToolList tools={tools} />
    </div>
  )
}
