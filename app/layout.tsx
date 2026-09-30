import type { Metadata, Viewport } from 'next'
import { Noto_Sans_TC, Sora } from 'next/font/google'
import './globals.css'

const display = Sora({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

const body = Noto_Sans_TC({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: '今晚誰會贏？',
  description: '烤肉聚會積分遊戲 — 吃飯聊天，偷偷累積分',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#e85d04',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
