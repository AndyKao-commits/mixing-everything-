export function generateStaticParams() {
  return [{ id: 'goblin-raid' }, { id: 'counter' }, { id: 'notes' }]
}

export default function ToolIdLayout({ children }: { children: React.ReactNode }) {
  return children
}
