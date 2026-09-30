import type { Metadata, Viewport } from 'next'
import { Sora, Noto_Sans_TC } from 'next/font/google'
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
  title: '今晚玩什麼？',
  description: '不用登入，輸入代號直接玩的聚會派對遊戲',
  applicationName: '今晚玩什麼',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ff3b5c',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  )
}
