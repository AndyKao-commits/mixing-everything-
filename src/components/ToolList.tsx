import Link from 'next/link'
import type { ToolDefinition } from '@/data/tools'
import { toolIcon } from '@/components/icons'

export function ToolList({ tools }: { tools: ToolDefinition[] }) {
  return (
    <ul className="tool-grid">
      {tools.map((tool) => (
        <li key={tool.id}>
          <Link href={`/tools/${tool.id}/`} className="tool-card">
            <span className="tool-card__icon">{toolIcon(tool.icon, 'tool-card__svg')}</span>
            <div className="tool-card__copy">
              <div className="tool-card__title-row">
                <h3>{tool.name}</h3>
                <span className="tool-card__status">{tool.status === 'ready' ? '可用' : '草稿'}</span>
              </div>
              <p className="tool-card__en">{tool.nameEn}</p>
              <p className="tool-card__desc">{tool.description}</p>
              <div className="tool-card__tags">
                {tool.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
