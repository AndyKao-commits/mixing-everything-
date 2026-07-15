import { Link, useParams } from 'react-router-dom'
import { getToolById } from '../data/tools'

export function ToolPage() {
  const { toolId } = useParams()
  const tool = toolId ? getToolById(toolId) : undefined

  if (!tool) {
    return (
      <section className="section section--page">
        <div className="section__intro">
          <h1>找不到這個工具</h1>
          <p>它可能還沒掛進來，或路徑寫錯了。</p>
          <Link className="btn btn--primary" to="/tools">
            回到目錄
          </Link>
        </div>
      </section>
    )
  }

  const Tool = tool.Component

  return (
    <section className="section section--page tool-page">
      <div className="tool-page__header">
        <Link className="back-link" to="/tools">
          ← 工具目錄
        </Link>
        <p className="eyebrow">{tool.nameEn}</p>
        <h1>{tool.name}</h1>
        <p>{tool.description}</p>
      </div>
      <div className="tool-stage">
        <Tool />
      </div>
    </section>
  )
}
