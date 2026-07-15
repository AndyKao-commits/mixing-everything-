import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="mx-auto min-h-svh max-w-3xl bg-raid-bg px-6 py-10 text-raid-ink">
      <Link href="/" className="text-sm text-raid-muted">
        ← 回首頁
      </Link>
      <h1 className="mt-4 font-display text-3xl font-bold">關於</h1>
      <p className="mt-4 text-raid-muted">
        Mixing Everything 是個人多功能站。Goblin Raid Remastered 以模組化系統架構重建，支援 LocalStorage 存檔與完整成長循環。
      </p>
    </main>
  )
}
