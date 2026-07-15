import { Link } from 'react-router-dom'
import type { CSSProperties } from 'react'
import type { ToolDefinition } from '../data/tools'

type ToolListProps = {
  tools: ToolDefinition[]
}

export function ToolList({ tools }: ToolListProps) {
  return (
    <ul className="tool-list">
      {tools.map((tool, index) => (
        <li
          key={tool.id}
          className="tool-list__item"
          style={{ '--i': index } as CSSProperties}
        >
          <Link to={`/tools/${tool.id}`} className="tool-list__link">
            <div className="tool-list__meta">
              <span className="tool-list__name">{tool.name}</span>
              <span className="tool-list__en">{tool.nameEn}</span>
            </div>
            <p className="tool-list__desc">{tool.description}</p>
            <div className="tool-list__tags">
              {tool.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
              <span className={`status status--${tool.status}`}>
                {tool.status === 'ready' ? '可用' : '草稿'}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
