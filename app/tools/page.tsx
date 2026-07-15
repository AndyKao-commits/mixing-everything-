import Link from 'next/link'

const TOOLS = [
  {
    id: 'goblin-raid',
    name: '哥布林討伐 2.0',
    blurb: '模組化 Idle RPG：自動戰鬥、裝備、技能樹、Boss、轉生、存檔。',
  },
  {
    id: 'counter',
    name: '計數器',
    blurb: '簡單點擊計數。',
  },
  {
    id: 'notes',
    name: '隨手記',
    blurb: '本機備註小工具。',
  },
]

export default function ToolsPage() {
  return (
    <main className="mx-auto min-h-svh max-w-3xl bg-raid-bg px-6 py-10 text-raid-ink">
      <Link href="/" className="text-sm text-raid-muted">
        ← 回首頁
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">工具列表</h1>
      <div className="mt-6 grid gap-3">
        {TOOLS.map((tool) => (
          <Link
            key={tool.id}
            href={`/tools/${tool.id}`}
            className="rounded-2xl border border-white/10 bg-raid-panel p-4 transition hover:border-raid-accent/40"
          >
            <div className="font-semibold">{tool.name}</div>
            <p className="mt-1 text-sm text-raid-muted">{tool.blurb}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
