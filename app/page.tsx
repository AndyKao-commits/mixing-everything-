import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col justify-center gap-6 bg-raid-bg px-6 py-16 text-raid-ink">
      <p className="text-xs uppercase tracking-[0.25em] text-raid-accent">Mixing Everything</p>
      <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">多功能小工具站</h1>
      <p className="max-w-xl text-raid-muted">小工具與小遊戲集中地。旗艦遊戲：Goblin Raid Remastered 2.0。</p>
      <div className="flex flex-wrap gap-3">
        <Link href="/tools" className="rounded-xl bg-raid-accent px-4 py-2 font-semibold text-raid-bg">
          前往工具
        </Link>
        <Link href="/tools/goblin-raid" className="rounded-xl border border-white/15 px-4 py-2">
          直接開打哥布林討伐
        </Link>
        <Link href="/about" className="rounded-xl border border-white/15 px-4 py-2">
          關於
        </Link>
      </div>
    </main>
  )
}
