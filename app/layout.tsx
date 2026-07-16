import type { Metadata } from 'next'
import { Space_Grotesk, IBM_Plex_Mono, Noto_Sans_TC } from 'next/font/google'
import { SiteHeader } from '@/components/SiteHeader'
import './globals.css'

const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})

const body = Noto_Sans_TC({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
})

export const metadata: Metadata = {
  title: 'Mixing Everything',
  description: '多功能小工具站基礎模板',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant" className={`${display.variable} ${mono.variable} ${body.variable}`}>
      <body>
        <div className="site-shell">
          <div className="site-atmosphere" aria-hidden="true" />
          <SiteHeader />
          <main className="site-main">{children}</main>
          <footer className="site-footer">
            <p>Mixing Everything — 小東西慢慢累積的地方</p>
          </footer>
        </div>
      </body>
    </html>
  )
}
