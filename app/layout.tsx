import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mixing Everything',
  description: '多功能小工具站 · Goblin Raid Remastered',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className="dark">
      <body>{children}</body>
    </html>
  )
}
