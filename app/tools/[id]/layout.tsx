import { tools } from '@/data/tools'

export function generateStaticParams() {
  return tools.map((tool) => ({ id: tool.id }))
}

export default function ToolIdLayout({ children }: { children: React.ReactNode }) {
  return children
}
